import os

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

from datetime import datetime, timezone, timedelta

import pytest
from pydantic import ValidationError

from app.routes.breaches import (
    BreachCreate,
    BreachReview,
    BreachResolve,
    _parsear_objeto,
    _prompt_analisis,
    _utc_naive,
)


EXPECTED_KEYS = {
    "gravedad",
    "justificacion",
    "datos_posibles",
    "notificar_agencia",
    "notificar_titulares",
    "motivo_notificacion",
    "acciones_inmediatas",
    "preguntas",
}


def test_parsear_objeto_json_valido_retorna_todas_las_claves():
    data = _parsear_objeto(
        '{"gravedad":"alta","justificacion":"Riesgo alto","datos_posibles":["correo"],'
        '"notificar_agencia":true,"notificar_titulares":false,"motivo_notificacion":"Daño probable",'
        '"acciones_inmediatas":["Revocar accesos"],"preguntas":["Cuantos afectados"]}'
    )
    assert set(data) == EXPECTED_KEYS
    assert data["gravedad"] == "alta"


def test_parsear_objeto_extrae_json_dentro_de_fences():
    data = _parsear_objeto(
        'Resultado:\n```json\n{"gravedad":"media","preguntas":["¿Cuál fue el alcance?"]}\n```\nFin'
    )
    assert data["gravedad"] == "media"
    assert data["preguntas"] == ["¿Cuál fue el alcance?"]


def test_parsear_objeto_texto_basura_lanza_error_controlado():
    with pytest.raises(ValueError, match="IA no devolvió JSON"):
        _parsear_objeto("esto no contiene un objeto json")


def test_parsear_objeto_normaliza_gravedad_invalida():
    data = _parsear_objeto('{"gravedad":"CRÍTICA-extra"}')
    assert data["gravedad"] == "media"

    data = _parsear_objeto('{"gravedad":"CRÍTICA"}')
    assert data["gravedad"] == "critica"


def test_prompt_analisis_incluye_descripcion_y_ley():
    prompt = _prompt_analisis("Se perdió una copia de datos en un computador.")
    assert "Se perdió una copia de datos en un computador." in prompt
    assert "Ley 21.719" in prompt


def test_utc_naive_convierte_fecha_con_zona_a_utc_sin_tzinfo():
    fecha = datetime(2026, 11, 6, 20, 30, tzinfo=timezone(timedelta(hours=-3)))
    resultado = _utc_naive(fecha)
    assert resultado.tzinfo is None
    assert resultado == datetime(2026, 11, 6, 23, 30)


def test_modelos_aceptan_datos_validos_y_rechazan_invalidos():
    BreachCreate(descripcion="Incidente suficientemente largo", fecha_deteccion=datetime.utcnow())
    BreachReview(gravedad="alta", cantidad_afectados=100, afectados_estimacion="aproximado")
    BreachResolve(causa_raiz="Configuración incorrecta", resolucion="Acceso revocado y evidencias preservadas")

    with pytest.raises(ValidationError):
        BreachCreate(descripcion="corta")
    with pytest.raises(ValidationError):
        BreachResolve(causa_raiz="corta", resolucion="corta")
    with pytest.raises(ValidationError):
        BreachReview()
