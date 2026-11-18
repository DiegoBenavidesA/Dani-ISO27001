"""Pruebas del registro de consumo de la IA frente a los límites de Groq."""
import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/normia_test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-not-for-production")

import pytest
from fastapi.testclient import TestClient

from app.services import uso_ia

CABECERAS = {
    "x-ratelimit-limit-requests": "1000", "x-ratelimit-limit-tokens": "8000",
    "x-ratelimit-remaining-requests": "998", "x-ratelimit-remaining-tokens": "2000",
    "x-ratelimit-reset-requests": "2m52.8s", "x-ratelimit-reset-tokens": "45s",
}


@pytest.fixture(autouse=True)
def limpio():
    uso_ia.reiniciar_para_pruebas()
    yield
    uso_ia.reiniciar_para_pruebas()


def test_duraciones_de_groq():
    assert uso_ia.duracion_a_segundos("2m52.8s") == pytest.approx(172.8)
    assert uso_ia.duracion_a_segundos("720ms") == pytest.approx(0.72)
    assert uso_ia.duracion_a_segundos("1h2m") == pytest.approx(3720)
    assert uso_ia.duracion_a_segundos(None) == 0


def test_minuto_toma_los_valores_de_groq_y_se_recupera_con_el_tiempo():
    uso_ia.registrar_cabeceras(CABECERAS, ahora=1000.0)
    m = uso_ia.resumen(ahora=1000.0)["minuto"]
    assert m == {"limite": 8000, "usados": 6000, "restantes": 2000, "se_recupera_en_s": 45.0}
    medio = uso_ia.resumen(ahora=1022.5)["minuto"]  # a mitad del tiempo, recuperó la mitad
    assert medio["restantes"] == 5000 and medio["se_recupera_en_s"] == 22.5
    assert uso_ia.resumen(ahora=1100.0)["minuto"]["restantes"] == 8000


def test_solicitudes_por_dia():
    uso_ia.registrar_cabeceras(CABECERAS, ahora=1000.0)
    s = uso_ia.resumen(ahora=1000.0)["solicitudes_dia"]
    assert s["limite"] == 1000 and s["restantes"] == 998


def test_dia_suma_tokens_y_groq_los_repone_de_forma_continua():
    uso_ia.registrar_tokens(13900, ahora=0.0)
    d = uso_ia.resumen(ahora=0.0)["dia"]
    assert d["limite"] == 200000 and d["usados"] == 13900 and d["se_recupera_por_minuto"] == 139
    # 200.000 / 24 h = 2,31 tokens por segundo: en 100 minutos se reponen unos 13.889.
    assert uso_ia.resumen(ahora=6000.0)["dia"]["usados"] == pytest.approx(11, abs=2)


def test_el_rechazo_por_limite_diario_sincroniza_con_groq():
    uso_ia.registrar_tokens(5000, ahora=0.0)
    uso_ia.registrar_error_cuota(
        "Rate limit reached for model `openai/gpt-oss-120b` in organization `org_x` service tier `on_demand` on "
        "tokens per day (TPD): Limit 200000, Used 199267, Requested 3045. Please try again in 16m38.784s.", ahora=10.0)
    d = uso_ia.resumen(ahora=10.0)["dia"]
    assert d["usados"] == 199267 and d["restantes"] == 733 and d["sincronizado_con_groq"] == 10.0


def test_el_rechazo_por_minuto_deja_el_minuto_agotado():
    uso_ia.registrar_error_cuota("on tokens per minute (TPM): Limit 8000, Used 7990, Requested 900. Please try again in 6.5s.", ahora=0.0)
    m = uso_ia.resumen(ahora=0.0)["minuto"]
    assert m["restantes"] == 10 and m["se_recupera_en_s"] == 6.5


def test_solo_el_superadmin_ve_el_uso():
    from app.main import app
    from app.services.auth_service import AuthService
    c = TestClient(app)

    def h(rol):
        t = AuthService.create_access_token({"sub": f"{rol}@x.cl", "role": rol, "user_id": f"id-{rol}", "organization_id": "org"})
        return {"Authorization": f"Bearer {t}"}
    assert c.get("/api/ai/uso", headers=h("admin")).status_code == 403
    r = c.get("/api/ai/uso", headers=h("superadmin"))
    assert r.status_code == 200 and r.json()["dia"]["limite"] == 200000
