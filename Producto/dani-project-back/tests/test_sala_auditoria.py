"""Auditoría externa: documentos con su referencia, vista del auditor, registro de
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


def test_referencia_de_cada_documento_del_generador():
    assert sala.referencia_de_documento("chapter_iso_alcance") == "ISO 27001, 4.3"
    assert sala.referencia_de_documento("chapter_iso_plan_tratamiento") == "ISO 27001, 6.1.3 e) y 8.3"
    assert sala.referencia_de_documento("chapter_ley_pol") == "Ley 21.719"
    assert sala.referencia_de_documento("chapter_no_existe") == ""


def test_el_rol_auditor_solo_recibe_documentos_publicados():
    assert sala._solo_publicados({"role": "auditor"}) is True
    assert sala._solo_publicados({"role": "admin"}) is False
    assert sala._solo_publicados({"role": "owner"}) is False


def test_las_acciones_del_superadmin_no_las_ve_la_empresa_ni_el_auditor():
    filas = [SimpleNamespace(rol="superadmin"), SimpleNamespace(rol="admin"), SimpleNamespace(rol="auditor")]
    assert [f.rol for f in sala._de_la_empresa(filas, {"role": "auditor"})] == ["admin", "auditor"]
    assert [f.rol for f in sala._de_la_empresa(filas, {"role": "owner"})] == ["admin", "auditor"]
    assert [f.rol for f in sala._de_la_empresa(filas)] == ["admin", "auditor"]  # CSV y paquete
    assert len(sala._de_la_empresa(filas, {"role": "superadmin"})) == 3



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
