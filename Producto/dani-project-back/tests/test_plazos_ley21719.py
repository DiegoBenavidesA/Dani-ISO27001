"""Pruebas del ajuste de plazos del banco de la Ley 21.719: cada pregunta
europea de plazos se reconoce una sola vez y se cambia por el plazo chileno."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace

ruta = Path(__file__).resolve().parent.parent / "scripts" / "ajustar_plazos_ley21719.py"
spec = importlib.util.spec_from_file_location("ajustar_plazos_ley21719", ruta)
script = importlib.util.module_from_spec(spec)
spec.loader.exec_module(script)

# Texto tal como viene en el listado de la AEPD (con su errata "solitud").
LISTADO = [
    "Se facilita al interesado el ejercicio de sus derechos",
    "Se informa al interesado en el plazo de un mes desde la recepción de su  solitud",
    "Se informa ante el ejercicio de derechos complejos o ante muchas solicitudes en el plazo máximo de \ntres meses  desde la recepción de la solicitud",
    "Se informa en el plazo de un mes de la prórroga de tres meses indicando el motivo de la dilación",
    "Se permite a los interesados  el ejercicio de derechos por medios electrónicos",
    "Se informa de las razones de la no actuación y de la posibilidad de presentar una reclamación ante una "
    "autoridad de control y de ejercitar acciones judiciales, en el plazo de un mes desde la recepción de la "
    "solicitud cuando no se da curso a la solicitud",
    "Se rectifican los datos personales inexactos sin dilación indebida",
]


def _preguntas(textos):
    return [SimpleNamespace(pregunta=t) for t in textos]


def test_cada_ajuste_reconoce_exactamente_una_pregunta():
    cambios = script.buscar_cambios(_preguntas(LISTADO))
    assert [len(encontradas) for _, encontradas in cambios] == [1, 1, 1, 1]
    elegidas = [encontradas[0].pregunta for _, encontradas in cambios]
    assert elegidas == [LISTADO[1], LISTADO[2], LISTADO[3], LISTADO[5]]


def test_tambien_reconoce_las_preguntas_en_forma_de_pregunta():
    textos = [f"¿{t}?" for t in LISTADO]
    cambios = script.buscar_cambios(_preguntas(textos))
    assert [len(encontradas) for _, encontradas in cambios] == [1, 1, 1, 1]


def test_los_textos_nuevos_usan_los_plazos_chilenos():
    textos = " ".join(a["pregunta"] for a in script.AJUSTES)
    assert "30 días corridos" in textos and "30 días hábiles" in textos
    assert "una sola vez" in textos and "Agencia de Protección de Datos Personales" in textos
    assert "un mes" not in textos and "tres meses" not in textos


def test_respeta_el_formato_de_la_pregunta_original():
    ajuste = script.AJUSTES[0]
    assert script.texto_nuevo(ajuste, "¿Se informa en el plazo de un mes?").startswith("¿")
    assert script.texto_nuevo(ajuste, "¿Se informa en el plazo de un mes?").endswith("?")
    assert not script.texto_nuevo(ajuste, "Se informa en el plazo de un mes").startswith("¿")


def test_una_pregunta_ya_ajustada_no_se_reconoce_de_nuevo():
    ya_ajustadas = _preguntas([a["pregunta"] for a in script.AJUSTES])
    assert all(len(e) == 0 for _, e in script.buscar_cambios(ya_ajustadas))
