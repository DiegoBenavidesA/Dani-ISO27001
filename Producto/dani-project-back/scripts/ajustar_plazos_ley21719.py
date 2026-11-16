"""
Ajusta a la ley chilena las preguntas de plazos del banco de la Ley 21.719.

El banco viene del listado de cumplimiento de la AEPD, que usa los plazos del
reglamento europeo (un mes, prórroga de tres meses). La Ley 21.719 fija otros
(artículo 11 de la Ley 19.628, según el texto publicado en el Diario Oficial
el 13-12-2024):

  - El responsable acusa recibo y responde dentro de 30 días corridos desde
    el ingreso de la solicitud.
  - Ese plazo se puede prorrogar una sola vez, hasta por 30 días corridos.
  - Debe guardar respaldo de la respuesta: dirección, fecha y contenido íntegro.
  - Si rechaza total o parcialmente, debe fundar la decisión e informar que el
    titular tiene 30 días hábiles para reclamar ante la Agencia.

Solo cambia el texto de cuatro preguntas; no borra preguntas ni respuestas.

Uso:
    python scripts/ajustar_plazos_ley21719.py            # solo muestra qué cambiaría
    python scripts/ajustar_plazos_ley21719.py --aplicar  # guarda los cambios
"""
import asyncio
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

# Cada ajuste: cómo reconocer la pregunta europea y el texto chileno que la reemplaza.
AJUSTES = [
    {
        "nombre": "Plazo de respuesta",
        "reconoce": lambda t: re.search(r"plazo de un mes desde la recepci", t) and not re.search(r"no actuaci", t),
        "pregunta": "Se acusa recibo de cada solicitud del titular y se responde dentro de los 30 días corridos siguientes a su ingreso",
        "evidencia": "Registro de solicitudes con la fecha de ingreso, el acuse de recibo y la fecha de respuesta.",
    },
    {
        "nombre": "Prórroga",
        "reconoce": lambda t: re.search(r"plazo m.ximo de\s+tres meses", t),
        "pregunta": "Cuando se necesita más tiempo para responder, el plazo se prorroga una sola vez y por no más de 30 días corridos adicionales",
        "evidencia": "Registro de las solicitudes prorrogadas con la fecha de la prórroga y la de la respuesta.",
    },
    {
        "nombre": "Respaldo de la respuesta",
        "reconoce": lambda t: re.search(r"pr.rroga de tres meses", t),
        "pregunta": "Se guarda respaldo de cada respuesta enviada al titular, con la dirección a la que se envió, la fecha y el contenido completo",
        "evidencia": "Copias de las respuestas enviadas, con su fecha y la dirección física o electrónica de destino.",
    },
    {
        "nombre": "Rechazo y reclamo ante la Agencia",
        "reconoce": lambda t: re.search(r"no actuaci", t),
        "pregunta": "Cuando se rechaza total o parcialmente una solicitud, se fundamenta la decisión y se informa al titular que tiene 30 días hábiles para reclamar ante la Agencia de Protección de Datos Personales",
        "evidencia": "Modelo de respuesta de rechazo con la causa, sus antecedentes y la mención del plazo para reclamar ante la Agencia.",
    },
]


def _normalizar(texto: str) -> str:
    return re.sub(r"\s+", " ", (texto or "").lower())


def texto_nuevo(ajuste: dict, pregunta_actual: str) -> str:
    """Respeta el formato de la pregunta original: con signos de pregunta o como afirmación."""
    if (pregunta_actual or "").strip().startswith("¿"):
        return f"¿{ajuste['pregunta']}?"
    return ajuste["pregunta"]


def buscar_cambios(preguntas):
    """preguntas: objetos con .pregunta. Devuelve [(ajuste, [preguntas que coinciden])]."""
    return [(a, [p for p in preguntas if a["reconoce"](_normalizar(p.pregunta))]) for a in AJUSTES]


async def main(aplicar: bool):
    from sqlalchemy import select
    from app.dependencies.database import AsyncSessionLocal
    import app.models  # noqa  (registra todos los modelos)
    from app.models.assessment_question import AssessmentQuestion

    async with AsyncSessionLocal() as db:
        preguntas = (await db.execute(
            select(AssessmentQuestion).where(AssessmentQuestion.marco == "ley21719")
        )).scalars().all()
        print(f"Preguntas de la Ley 21.719 en la base: {len(preguntas)}\n")

        listos = []
        for ajuste, encontradas in buscar_cambios(preguntas):
            print(f"[{ajuste['nombre']}]")
            if len(encontradas) != 1:
                print(f"  Se esperaba 1 pregunta y se encontraron {len(encontradas)}. Se omite.")
                for p in encontradas:
                    print(f"    - {p.pregunta}")
                print()
                continue
            p = encontradas[0]
            nueva = texto_nuevo(ajuste, p.pregunta)
            if p.pregunta == nueva:
                print("  Ya estaba ajustada.\n")
                continue
            print(f"  Antes:   {p.pregunta}")
            print(f"  Después: {nueva}\n")
            listos.append((p, nueva, ajuste["evidencia"]))

        if not listos:
            print("No hay nada que cambiar.")
            return
        if not aplicar:
            print("No se guardó nada. Para aplicar los cambios, vuelve a ejecutar con --aplicar.")
            return
        for p, nueva, evidencia in listos:
            p.pregunta = nueva
            p.evidencia_esperada = evidencia
        await db.commit()
        print(f"Preguntas actualizadas: {len(listos)}")


if __name__ == "__main__":
    asyncio.run(main("--aplicar" in sys.argv))
