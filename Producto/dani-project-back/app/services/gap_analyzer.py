# app/services/gap_analyzer.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Dict, Any
from datetime import datetime, timedelta
import json
import openai
from app.config import settings

from app.models.gap_analysis import GapAnalysis, RemediationAction, ControlImplementation, KPI, PriorityLevel, GapStatus
from app.models.iso_controls import ISOCControl
from app.models.evidence import Evidence

class GapAnalyzer:
    """Analizador de brechas ISO 27001"""

    def __init__(self, db_session: AsyncSession, org_id: str = None):
        self.db = db_session
        # El refactor multi-tenant hace que las rutas instancien GapAnalyzer(db, org_id).
        # Se acepta y se guarda para poder filtrar por empresa cuando corresponda.
        self.org_id = org_id
    
    async def generate_complete_gap_analysis(self) -> Dict[str, Any]:
        """Generar análisis de brecha completo"""
        
        # 1. Análisis por cláusula
        clause_gaps = await self._analyze_clauses()
        
        # 2. Análisis de controles
        control_gaps = await self._analyze_controls()
        
        # 3. Matriz de madurez
        maturity_matrix = await self._calculate_maturity()
        
        # 4. Plan de remediación
        remediation_plan = await self._create_remediation_plan()
        
        # 5. Dashboard de KPIs
        kpi_dashboard = await self._generate_kpi_dashboard()
        
        # 6. Score general
        overall_score = await self._calculate_overall_score()
        
        return {
            "clause_gaps": clause_gaps,
            "control_gaps": control_gaps,
            "maturity_matrix": maturity_matrix,
            "remediation_plan": remediation_plan,
            "kpi_dashboard": kpi_dashboard,
            "overall_score": overall_score,
            "certification_readiness": self._get_readiness_level(overall_score),
            "estimated_certification_date": self._estimate_date(overall_score)
        }
    
    async def _analyze_clauses(self) -> List[Dict]:
        """Analizar brechas por cláusula"""
        clauses = [
            {"id": "4", "name": "Contexto", "weight": 0.05, "requirements": ["4.1", "4.2", "4.3", "4.4"]},
            {"id": "5", "name": "Liderazgo", "weight": 0.10, "requirements": ["5.1", "5.2", "5.3"]},
            {"id": "6", "name": "Planificación", "weight": 0.15, "requirements": ["6.1", "6.2"]},
            {"id": "7", "name": "Soporte", "weight": 0.15, "requirements": ["7.1", "7.2", "7.3", "7.4", "7.5"]},
            {"id": "8", "name": "Operación", "weight": 0.25, "requirements": ["8.1", "8.2", "8.3"]},
            {"id": "9", "name": "Evaluación", "weight": 0.15, "requirements": ["9.1", "9.2", "9.3"]},
            {"id": "10", "name": "Mejora", "weight": 0.15, "requirements": ["10.1", "10.2"]}
        ]
        
        results = []
        for clause in clauses:
            # Evaluar cada cláusula (simplificado)
            current_score = await self._evaluate_clause(clause["id"])
            target_score = 100
            gap = target_score - current_score
            
            results.append({
                "clause_id": clause["id"],
                "clause_name": clause["name"],
                "current_score": current_score,
                "target_score": target_score,
                "gap": gap,
                "weight": clause["weight"],
                "priority": self._get_priority(gap),
                "requirements": clause["requirements"]
            })
        
        return results
    
    def _calc_score(self, controls: list) -> float:
        """Implementado=1pt, Planificado=0.5pt, No Implementado=0pt"""
        if not controls:
            return 0.0
        points = sum(
            1.0 if c.status == "Implementado" else (0.5 if c.status == "Planificado" else 0.0)
            for c in controls
        )
        return round((points / len(controls)) * 100, 1)

    async def _get_all_applicable_controls(self) -> list:
        """Retorna todos los controles aplicables de la BD"""
        result = await self.db.execute(
            select(ISOCControl).where(ISOCControl.applies == True)
        )
        return result.scalars().all()

    async def _evaluate_clause(self, clause_id: str) -> float:
        """Calcula el score real de una cláusula desde el estado de los controles en BD"""
        from sqlalchemy import or_

        # Prefijos de control_id del Anexo A que corresponden a cada cláusula ISO 27001
        clause_control_map = {
            "4": [],              # Contexto → sin Anexo A directo, usa promedio general
            "5": ["5."],          # Liderazgo → controles organizacionales
            "6": ["5."],          # Planificación → planificación de riesgos (mismos controles org.)
            "7": ["6."],          # Soporte → controles de personas
            "8": ["7.", "8."],    # Operación → físicos + tecnológicos
            "9": ["8."],          # Evaluación del desempeño → monitoreo tecnológico
            "10": ["5.", "8."],   # Mejora → organizacionales + tecnológicos
        }

        prefixes = clause_control_map.get(clause_id, [])
        all_applicable = await self._get_all_applicable_controls()

        if not prefixes:
            # Cláusula 4 y fallback: score general de todos los controles aplicables
            return self._calc_score(all_applicable) if all_applicable else 50.0

        controls = [
            c for c in all_applicable
            if any(c.control_id.startswith(p) for p in prefixes)
        ]

        if not controls:
            return self._calc_score(all_applicable) if all_applicable else 50.0

        return self._calc_score(controls)
    
    async def _analyze_controls(self) -> Dict:
        """Analizar brechas de controles desde la BD"""
        result = await self.db.execute(select(ISOCControl))
        all_controls = result.scalars().all()

        applicable = [c for c in all_controls if c.applies]
        implemented = [c for c in applicable if c.status == "Implementado"]
        planned = [c for c in applicable if c.status == "Planificado"]
        pending = [c for c in applicable if c.status not in ("Implementado", "Planificado")]

        # Agrupar por categoría
        by_category: Dict = {}
        for c in applicable:
            cat = (c.category or "organizational").lower()
            if cat not in by_category:
                by_category[cat] = {"total": 0, "implemented": 0, "percentage": 0}
            by_category[cat]["total"] += 1
            if c.status == "Implementado":
                by_category[cat]["implemented"] += 1

        for cat in by_category:
            t = by_category[cat]["total"]
            i = by_category[cat]["implemented"]
            by_category[cat]["percentage"] = round((i / t) * 100, 1) if t > 0 else 0

        # Prioridades: controles críticos que aún no están implementados
        critical_ids = ["5.15", "5.16", "8.7", "8.8", "8.13", "5.24"]
        high_ids = ["5.2", "5.3", "6.3", "8.1", "8.2", "8.15", "8.20"]
        control_id_set = {c.control_id: c.status for c in all_controls}

        return {
            "by_priority": {
                "critical": [cid for cid in critical_ids if control_id_set.get(cid) != "Implementado"],
                "high": [cid for cid in high_ids if control_id_set.get(cid) != "Implementado"],
                "medium": [],
                "low": []
            },
            "by_category": by_category,
            "total_controls": len(all_controls),
            "implemented_controls": len(implemented),
            "partial_controls": len(planned),
            "pending_controls": len(pending)
        }
    
    async def _calculate_maturity(self) -> Dict:
        """Calcular matriz de madurez"""
        areas = {
            "Liderazgo": {"current": 2, "target": 4},
            "Gestión de Riesgos": {"current": 3, "target": 5},
            "Controles": {"current": 1, "target": 3},
            "Monitoreo": {"current": 2, "target": 4},
            "Mejora Continua": {"current": 1, "target": 4},
            "Cultura Seguridad": {"current": 2, "target": 4},
            "Documentación": {"current": 2, "target": 3},
            "Auditoría": {"current": 1, "target": 3}
        }
        
        total_current = sum(area["current"] for area in areas.values()) / len(areas)
        total_target = sum(area["target"] for area in areas.values()) / len(areas)
        
        return {
            "areas": areas,
            "overall_current": round(total_current, 1),
            "overall_target": round(total_target, 1),
            "gap": round(total_target - total_current, 1),
            "level_description": self._get_maturity_level_description(total_current)
        }
    
    async def _create_remediation_plan(self) -> Dict:
        """Crear plan de remediación"""
        # Controles P0 (prioridad crítica)
        p0_controls = [
            {"id": "5.15", "title": "Control de acceso - MFA", "hours": 40, "responsible": "Security"},
            {"id": "5.16", "title": "Gestión de identidades", "hours": 30, "responsible": "DevOps"},
            {"id": "8.8", "title": "Escáner vulnerabilidades", "hours": 20, "responsible": "Security"},
            {"id": "8.13", "title": "Copia seguridad 100%", "hours": 20, "responsible": "IT"},
            {"id": "5.24", "title": "Plan de incidentes", "hours": 25, "responsible": "CISO"}
        ]
        
        # Controles P1 (prioridad alta)
        p1_controls = [
            {"id": "5.2", "title": "Roles y responsabilidades", "hours": 15, "responsible": "HR"},
            {"id": "5.12", "title": "Clasificación información", "hours": 20, "responsible": "CISO"},
            {"id": "8.15", "title": "Registro centralizado", "hours": 30, "responsible": "DevOps"}
        ]
        
        return {
            "sprint_1": {
                "duration_days": 15,
                "controls": p0_controls,
                "total_hours": sum(c["hours"] for c in p0_controls),
                "start_date": datetime.utcnow().isoformat(),
                "end_date": (datetime.utcnow() + timedelta(days=15)).isoformat()
            },
            "sprint_2": {
                "duration_days": 30,
                "controls": p1_controls,
                "total_hours": sum(c["hours"] for c in p1_controls),
                "start_date": (datetime.utcnow() + timedelta(days=15)).isoformat(),
                "end_date": (datetime.utcnow() + timedelta(days=45)).isoformat()
            },
            "estimated_completion": (datetime.utcnow() + timedelta(days=90)).isoformat(),
            "estimated_cost_usd": 16350,
            "total_hours": 200
        }
    
    async def _generate_kpi_dashboard(self) -> Dict:
        """Generar dashboard de KPIs"""
        result = await self.db.execute(select(KPI))
        kpis = result.scalars().all()

        if not kpis:
            default_kpis = self._get_default_kpis()
            for kpi_data in default_kpis:
                self.db.add(KPI(**kpi_data))
            await self.db.commit()
            kpis = default_kpis  # dicts, compatibles con _format_kpis

        return self._format_kpis(kpis)
    
    async def _calculate_overall_score(self) -> Dict:
        """Calcular score general de cumplimiento"""
        clause_scores = await self._analyze_clauses()
        weighted_sum = sum(c["current_score"] * c["weight"] for c in clause_scores)

        control_analysis = await self._analyze_controls()
        control_score = (control_analysis["implemented_controls"] / (control_analysis["total_controls"] or 1)) * 100

        # Score general
        overall = (weighted_sum + control_score) / 2

        gap = max(0, 85 - overall)
        months_needed = max(1, gap / 10)
        estimated_date = datetime.utcnow() + timedelta(days=int(months_needed * 30))

        # Triple Score: Documentado / Implementado / Probado
        all_result = await self.db.execute(
            select(ISOCControl).where(ISOCControl.applies == True)
        )
        all_controls = all_result.scalars().all()
        total = len(all_controls) or 1

        documented = sum(1 for c in all_controls if c.document_id)
        implemented = sum(1 for c in all_controls if c.status == "Implementado")

        ev_result = await self.db.execute(select(Evidence))
        evidences = ev_result.scalars().all()
        controls_with_evidence = set()
        for ev in evidences:
            ctrl = (ev.evidence_metadata or {}).get("control", "")
            if ctrl:
                controls_with_evidence.add(ctrl.strip().upper())

        impl_controls_ids = {c.control_id.strip().upper() for c in all_controls if c.status == "Implementado" and c.control_id}
        tested = len(impl_controls_ids & controls_with_evidence)
        impl_total = len(impl_controls_ids) or 1

        return {
            "overall_score": round(overall, 1),
            "clause_score": weighted_sum,
            "control_score": control_score,
            "implemented_controls": control_analysis["implemented_controls"],
            "total_controls": control_analysis["total_controls"],
            "required_for_certification": 85,
            "gap_to_certification": round(85 - overall, 1),
            "trend": "up" if overall > 50 else "down",
            "estimated_certification_date": estimated_date.strftime("%b %d, %Y"),
            "days_to_certification": max(0, (estimated_date - datetime.utcnow()).days),
            "doc_score": round(documented / total * 100),
            "impl_score": round(implemented / total * 100),
            "tested_score": round(tested / impl_total * 100),
        }
    
    def _get_priority(self, gap: float) -> str:
        if gap > 30:
            return "critical"
        elif gap > 15:
            return "high"
        elif gap > 5:
            return "medium"
        return "low"
    
    def _get_readiness_level(self, score: Dict) -> str:
        if score["overall_score"] >= 85:
            return "ready"
        elif score["overall_score"] >= 70:
            return "almost_ready"
        elif score["overall_score"] >= 50:
            return "in_progress"
        return "not_ready"
    
    def _estimate_date(self, score: Dict) -> str:
        current = score["overall_score"]
        target = 85
        gap = target - current
        months_needed = max(1, gap / 10)  # Aprox 10% por mes
        return (datetime.utcnow() + timedelta(days=int(months_needed * 30))).isoformat()
    
    def _get_maturity_level_description(self, level: float) -> str:
        if level < 1.5:
            return "Inicial - Procesos impredecibles"
        elif level < 2.5:
            return "Repetible - Procesos básicos documentados"
        elif level < 3.5:
            return "Definido - Procesos estandarizados"
        elif level < 4.5:
            return "Gestionado - Procesos medidos y controlados"
        return "Optimizado - Mejora continua"
    
    def _get_default_kpis(self) -> List[Dict]:
        return [
            {"name": "Nivel cumplimiento ISO", "category": "strategic", "target_value": 85, "current_value": 59, "unit": "%", "frequency": "monthly"},
            {"name": "Riesgos críticos", "category": "strategic", "target_value": 0, "current_value": 2, "unit": "count", "frequency": "weekly"},
            {"name": "Usuarios con MFA", "category": "security", "target_value": 100, "current_value": 0, "unit": "%", "frequency": "weekly"},
            {"name": "Vulnerabilidades críticas", "category": "security", "target_value": 0, "current_value": 2, "unit": "count", "frequency": "weekly"},
            {"name": "Backup exitoso", "category": "operational", "target_value": 100, "current_value": 100, "unit": "%", "frequency": "daily"},
            {"name": "Disponibilidad", "category": "operational", "target_value": 99.9, "current_value": 99.95, "unit": "%", "frequency": "daily"},
        ]
    
    def _get_kpi_category(self, kpi) -> str:
        """Obtiene la categoría de un KPI sea dict u objeto ORM."""
        if isinstance(kpi, dict):
            return kpi.get("category", "")
        return getattr(kpi, "category", "")

    def _kpi_to_dict(self, kpi) -> Dict:
        if isinstance(kpi, dict):
            return kpi
        return {
            "id": str(getattr(kpi, "id", "")),
            "name": getattr(kpi, "name", ""),
            "category": getattr(kpi, "category", ""),
            "target_value": getattr(kpi, "target_value", 0),
            "current_value": getattr(kpi, "current_value", 0),
            "unit": getattr(kpi, "unit", ""),
            "frequency": getattr(kpi, "frequency", ""),
            "status": getattr(kpi, "status", ""),
        }

    def _format_kpis(self, kpis: List) -> Dict:
        serialized = [self._kpi_to_dict(k) for k in kpis]
        return {
            "strategic": [k for k in serialized if k.get("category") == "strategic"],
            "operational": [k for k in serialized if k.get("category") == "operational"],
            "security": [k for k in serialized if k.get("category") == "security"],
            "timestamp": datetime.utcnow().isoformat()
        }

    # ──────────────────────────────────────────────────────────────────────────
    # ANÁLISIS DE DOCUMENTO CON LLM (lo que pidió Max: evaluar si el documento
    # del cliente cumple con los controles ISO 27001)
    # ──────────────────────────────────────────────────────────────────────────

    # Controles ISO 27001:2022 descompuestos (trabajo que se hace una vez).
    # Cada entrada: id, título, qué debe contener un documento para cumplirlo.
    ISO_CONTROLS_CHECKLIST = [
        {"id": "5.1",  "title": "Políticas de seguridad de la información",        "requires": "política aprobada por dirección, revisada periódicamente y comunicada"},
        {"id": "5.2",  "title": "Roles y responsabilidades de seguridad",           "requires": "definición de roles CISO/responsable de seguridad y sus funciones"},
        {"id": "5.15", "title": "Control de acceso",                                "requires": "política de control de acceso, criterios de otorgamiento y revocación"},
        {"id": "5.16", "title": "Gestión de identidades",                           "requires": "procedimiento para crear, modificar y eliminar usuarios/cuentas"},
        {"id": "5.24", "title": "Planificación de respuesta a incidentes",          "requires": "plan de respuesta a incidentes con roles, escalado y pasos de contención"},
        {"id": "6.1",  "title": "Gestión de riesgos de seguridad",                 "requires": "metodología de evaluación de riesgos, criterios de aceptación y tratamiento"},
        {"id": "7.2",  "title": "Competencia del personal",                         "requires": "requisitos de capacitación en seguridad, registros de formación"},
        {"id": "7.3",  "title": "Concienciación en seguridad",                      "requires": "programa de concientización, materiales y frecuencia"},
        {"id": "7.5",  "title": "Información documentada (control documental)",     "requires": "procedimiento de control de documentos: versiones, aprobación, distribución"},
        {"id": "8.1",  "title": "Planificación y control operacional",              "requires": "procedimientos operativos documentados para procesos críticos"},
        {"id": "8.7",  "title": "Protección contra malware",                        "requires": "política antimalware, herramientas utilizadas y frecuencia de actualización"},
        {"id": "8.8",  "title": "Gestión de vulnerabilidades técnicas",             "requires": "proceso de escaneo, parcheo y seguimiento de vulnerabilidades"},
        {"id": "8.13", "title": "Copia de seguridad (Backup)",                      "requires": "política de backup: frecuencia, retención, pruebas de restauración"},
        {"id": "8.15", "title": "Registro de eventos (Logging)",                    "requires": "qué eventos se registran, retención de logs y revisión periódica"},
        {"id": "8.20", "title": "Seguridad de redes",                               "requires": "arquitectura de red segmentada, cortafuegos y monitoreo de tráfico"},
    ]

    async def analyze_document_with_llm(self, document_text: str, document_name: str = "Documento") -> Dict[str, Any]:
        """
        Evalúa un documento del cliente contra los controles ISO 27001:2022.
        Hace UNA llamada al LLM que evalúa todos los controles a la vez.
        Retorna: qué controles cumple, cuáles no, score global y brechas detectadas.
        """
        controls_json = json.dumps(self.ISO_CONTROLS_CHECKLIST, ensure_ascii=False, indent=2)

        system_prompt = (
            "Eres un auditor experto en ISO 27001:2022. "
            "Analizas documentos de clientes y determinas si cubren los controles de la norma. "
            "Respondes ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown."
        )

        user_prompt = f"""Analiza el siguiente documento llamado "{document_name}" y evalúa si cumple con cada uno de estos controles ISO 27001:2022.

CONTROLES A EVALUAR:
{controls_json}

DOCUMENTO DEL CLIENTE:
---
{document_text[:6000]}
---

Responde con este JSON exacto (sin texto extra):
{{
  "document_name": "{document_name}",
  "controls": [
    {{
      "id": "<id del control>",
      "title": "<título>",
      "compliant": true/false,
      "score": <0-100>,
      "finding": "<qué cubre o qué le falta en 1 oración>"
    }}
  ],
  "overall_score": <promedio de scores 0-100>,
  "compliant_count": <número de controles que pasan con score>=70>,
  "total_evaluated": {len(self.ISO_CONTROLS_CHECKLIST)},
  "gaps": ["<brecha 1>", "<brecha 2>", ...],
  "summary": "<resumen ejecutivo en 2 oraciones>"
}}"""

        try:
            client = openai.AsyncOpenAI(
                api_key=settings.AI_API_KEY,
                base_url=settings.AI_BASE_URL
            )
            response = await client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2
            )
            raw = response.choices[0].message.content.strip()
            # Limpiar si viene con bloque markdown
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            result = json.loads(raw)
            result["analyzed_at"] = datetime.utcnow().isoformat()
            result["mode"] = "llm"
            return result

        except json.JSONDecodeError:
            return {
                "document_name": document_name,
                "error": "El LLM no devolvió JSON válido",
                "raw_response": raw if 'raw' in dir() else "",
                "mode": "error"
            }
        except Exception as e:
            # Fallback demo si la API no responde
            return self._demo_analysis(document_name, str(e))

    def _demo_analysis(self, document_name: str, error: str) -> Dict[str, Any]:
        """Respuesta demo cuando la API no está disponible."""
        demo_controls = []
        scores = []
        for i, ctrl in enumerate(self.ISO_CONTROLS_CHECKLIST):
            score = 85 if i % 3 != 0 else 30
            scores.append(score)
            demo_controls.append({
                "id": ctrl["id"],
                "title": ctrl["title"],
                "compliant": score >= 70,
                "score": score,
                "finding": "✅ Cubierto en el documento." if score >= 70 else f"⚠️ Falta: {ctrl['requires']}."
            })
        overall = round(sum(scores) / len(scores), 1)
        compliant = sum(1 for s in scores if s >= 70)
        return {
            "document_name": document_name,
            "controls": demo_controls,
            "overall_score": overall,
            "compliant_count": compliant,
            "total_evaluated": len(self.ISO_CONTROLS_CHECKLIST),
            "gaps": [c["title"] for c in demo_controls if not c["compliant"]],
            "summary": f"[MODO DEMO] El documento cubre {compliant}/{len(self.ISO_CONTROLS_CHECKLIST)} controles ISO 27001 evaluados con un score de {overall}%.",
            "analyzed_at": datetime.utcnow().isoformat(),
            "mode": "demo",
            "api_error": error
        }