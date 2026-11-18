"""Pruebas del ocultamiento de datos personales antes de enviar texto a la IA."""
import asyncio
import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

from app.services.datos_personales import contar, describir, ocultar, ocultar_mensajes, rut_valido


def test_rut_con_digito_verificador():
    assert rut_valido("12.345.678", "5") and rut_valido("11111111", "1")
    assert not rut_valido("7654321", "5")
    texto, n = ocultar("Paciente RUT 12.345.678-5; otro 7654321-6; inválido 7654321-5")
    assert n["rut"] == 2 and "12.345.678-5" not in texto and "7654321-5" in texto


def test_correos_telefonos_y_tarjetas():
    texto, n = ocultar("juan.perez@gmail.com, +56 9 8765 4321, (2) 2345 6789, +56 61 2000 000, 4111 1111 1111 1111")
    assert n == {"rut": 0, "correo": 1, "telefono": 3, "tarjeta": 1}
    assert "8765" not in texto and "@" not in texto and "4111" not in texto
    assert "[RUT oculto]" not in texto and "[correo oculto]" in texto


def test_no_confunde_montos_fechas_ni_identificadores():
    texto = ("Presupuesto 4.200.000 pesos aprobado el 15-10-2026; 23 de 25 personas; versión 2.0; "
             "tarjeta falsa 1234 5678 9012 3456; id 3f2a9c1e-1234-4abc-9def-0123456789ab")
    assert ocultar(texto) == (texto, {"rut": 0, "correo": 0, "telefono": 0, "tarjeta": 0})


def test_describir():
    assert describir({"rut": 3, "correo": 1, "telefono": 0, "tarjeta": 0}) == "3 RUT y 1 correo"
    assert describir({"rut": 0, "correo": 2, "telefono": 1, "tarjeta": 0}) == "2 correos y 1 teléfono"
    assert describir({"rut": 0}) == ""


def test_ocultar_mensajes_no_modifica_lo_que_no_es_texto():
    mensajes = [{"role": "user", "content": "RUT 11.111.111-1"}, {"role": "system", "content": None}]
    salida = ocultar_mensajes(mensajes)
    assert salida[0]["content"] == "RUT [RUT oculto]" and salida[1]["content"] is None
    assert mensajes[0]["content"] == "RUT 11.111.111-1"  # el original no se toca


def test_la_ia_recibe_el_texto_sin_datos_personales():
    from app.services.ai_service import proteger_datos_personales
    recibido = {}

    class _Completions:
        async def create(self, **kwargs):
            recibido["messages"] = kwargs["messages"]
            return "respuesta"

    class _Cliente:
        def __init__(self):
            self.chat = type("Chat", (), {})()
            self.chat.completions = _Completions()

    cliente = proteger_datos_personales(_Cliente())
    r = asyncio.run(cliente.chat.completions.create(
        model="x", messages=[{"role": "user", "content": "Ficha de 12.345.678-5, contacto ana@clinica.cl"}]))
    assert r == "respuesta"
    assert recibido["messages"][0]["content"] == "Ficha de [RUT oculto], contacto [correo oculto]"


def test_contar_texto_vacio():
    assert contar("") == {"rut": 0, "correo": 0, "telefono": 0, "tarjeta": 0}
