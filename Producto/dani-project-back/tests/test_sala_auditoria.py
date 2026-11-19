"""Sala de Auditoría: carpetas por cláusula, vista del auditor, registro de
actividad con cadena de hashes y búsqueda con IA limitada a la empresa."""
import asyncio
import os
from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import app.routes.audit_room as sala
import app.routes.chat as chat
from app.models.registro_actividad import RegistroActividad
from app.services import registro


def test_clausula_de_cada_pregunta():
    assert sala.clausula_de_codigo("4.1") == "4"
    assert sala.clausula_de_codigo("10.2") == "10"
    assert sala.clausula_de_codigo("A.5.15") == "A"
    assert sala.clausula_de_codigo("Ley 21.719") is None


def test_clausula_de_cada_documento_del_generador():
    assert sala.clausula_de_documento("chapter_iso_politica") == "5"
    assert sala.clausula_de_documento("chapter_iso_tratamiento_riesgos") in (None, "6")
    assert sala.clausula_de_documento("chapter_iso_alcance") == "4"
    assert sala.clausula_de_documento("chapter_no_existe") is None


def test_puntaje_por_clausula_igual_que_el_analisis_de_brechas():
    preguntas = [("q1", "4.1"), ("q2", "4.2"), ("q3", "4.3"), ("q4", "5.1"), ("q5", "A.5.1")]
    respuestas = {"q1": "cumple", "q2": "parcial", "q3": "no_aplica", "q5": "no_cumple"}
    p = sala.puntajes_por_clausula(preguntas, respuestas)
    assert p["4"] == {"total_preguntas": 2, "evaluadas": 2, "cumplen": 1, "puntaje": 75}
    assert p["5"]["puntaje"] is None and p["5"]["evaluadas"] == 0  # sin evaluar, no 0 %
    assert p["A"]["puntaje"] == 0


def test_el_rol_auditor_siempre_ve_la_vista_del_auditor():
    assert sala._vista_auditor({"role": "auditor"}, False) is True
    assert sala._vista_auditor({"role": "admin"}, False) is False


def _fila(i, anterior):
    f = RegistroActividad(organization_id="org", fecha=datetime(2026, 11, 19, 10) + timedelta(minutes=i),
                          usuario_email="dueno@clinica.cl", rol="owner", ip="1.2.3.4",
                          accion="publico", tipo_recurso="documento", recurso=f"Doc {i}", detalle="v1.0")
    f.hash_anterior = anterior
    f.hash = registro.calcular_hash(f, anterior)
    return f


def test_la_cadena_del_registro_detecta_una_fila_alterada():
    filas, anterior = [], None
    for i in range(3):
        f = _fila(i, anterior); filas.append(f); anterior = f.hash
    assert registro.verificar_cadena(filas)["integra"] is True

    filas[1].usuario_email = "otro@clinica.cl"  # alguien cambia quién lo hizo
    r = registro.verificar_cadena(filas)
    assert r["integra"] is False and r["verificadas"] == 1 and r["primera_alterada"]["recurso"] == "Doc 1"


def test_la_cadena_detecta_una_fila_borrada():
    filas, anterior = [], None
    for i in range(3):
        f = _fila(i, anterior); filas.append(f); anterior = f.hash
    del filas[1]
    assert registro.verificar_cadena(filas)["integra"] is False


def test_registrar_guarda_usuario_ip_y_sello():
    db = MagicMock()
    db.execute = AsyncMock(side_effect=[
        MagicMock(scalar_one_or_none=lambda: "Ignacio Soto"),      # nombre del usuario
        MagicMock(scalar_one_or_none=lambda: "a" * 64),             # hash de la fila anterior
    ])
    db.commit = AsyncMock()
    token = registro.ip_actual.set("200.1.2.3")
    try:
        asyncio.run(registro.registrar(db, "org", {"user_id": "u1", "sub": "ignacio@clinica.cl", "role": "owner"},
                                       "aprobo", "documento", "Política de Seguridad", "En revisión a Aprobado"))
    finally:
        registro.ip_actual.reset(token)
    fila = db.add.call_args[0][0]
    assert (fila.usuario_nombre, fila.ip, fila.accion, fila.hash_anterior) == ("Ignacio Soto", "200.1.2.3", "aprobo", "a" * 64)
    assert fila.hash == registro.calcular_hash(fila, "a" * 64)
    db.commit.assert_awaited()


def test_markdown_del_generador_a_html():
    h = sala.markdown_a_html("# Política\n\nTexto con **negrita**.\n\n- uno\n- dos\n\n| A | B |\n|---|---|\n| 1 | 2 |")
    assert "<h1>Política</h1>" in h and "<b>negrita</b>" in h and "<li>dos</li>" in h
    assert "<th>A</th>" in h and "<td>2</td>" in h and "---" not in h


def test_la_busqueda_con_ia_solo_mira_evidencias_de_la_empresa():
    consultas = []

    async def ejecutar(stmt):
        consultas.append(str(stmt.compile(compile_kwargs={"literal_binds": False})))
        r = MagicMock()
        r.scalars.return_value.all.return_value = []
        return r

    db = MagicMock(); db.execute = ejecutar
    pedido = chat.ChatRequest(message="¿qué evidencia tengo de control de accesos?")
    with patch.object(chat.embedding_service, "generate_single_embedding", return_value=[0.0] * 384), \
         patch.object(chat.ai_service, "chat", AsyncMock(return_value="respuesta")):
        r = asyncio.run(chat.chat_endpoint(pedido, db, {"role": "admin", "user_id": "u1"}, "org-clinica"))
    sql_evidencias = [c for c in consultas if "evidence_chunks" in c]
    assert sql_evidencias and "evidences.organization_id" in sql_evidencias[0]
    assert r == {"reply": "respuesta", "fuentes": []}
