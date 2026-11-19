"""Detecta y oculta datos personales antes de enviar texto a la IA.

La IA (Groq) es un servicio de Estados Unidos: enviarle datos personales de
pacientes o trabajadores sería una transferencia internacional innecesaria.
La Ley 21.719 pide tratar solo los datos necesarios, y para evaluar si una
empresa cumple basta con saber que un registro existe, no quiénes aparecen.

Se reconocen los datos con formato fijo, donde la detección es confiable:
RUT (validando el dígito verificador), correos, teléfonos chilenos y números
de tarjeta (validando con el algoritmo de Luhn). Los nombres de personas y
los diagnósticos escritos libremente NO se detectan: requieren modelos de
lenguaje que no caben en el servidor.
"""
import re

MARCAS = {
    "rut": "[RUT oculto]",
    "correo": "[correo oculto]",
    "telefono": "[teléfono oculto]",
    "tarjeta": "[tarjeta oculta]",
}

_RUT = re.compile(r"(?<![\w.])(\d{1,2}\.\d{3}\.\d{3}|\d{7,8})-([\dkK])(?![\w-])")
_CORREO = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
# Teléfonos chilenos de 9 dígitos: celulares (9 + 8), Santiago (2 + 8) y
# regiones (código de 2 dígitos + 7), con o sin +56 y con espacios o guiones.
_SEP = r"[\s.-]?"
_TELEFONO = re.compile(
    r"(?<![\w+.-])(?:\+?56" + _SEP + r")?"
    r"(?:\(?9\)?(?:" + _SEP + r"\d){8}|\(?2\)?(?:" + _SEP + r"\d){8}|\(?[3-8]\d\)?(?:" + _SEP + r"\d){7})"
    r"(?![\w-])"
)
_TARJETA = re.compile(r"(?<![\w-])(?:\d[ -]?){13,19}(?![\w-])")


def rut_valido(cuerpo: str, dv: str) -> bool:
    """Valida el dígito verificador del RUT (módulo 11)."""
    numeros = re.sub(r"\D", "", cuerpo)
    if not numeros:
        return False
    suma, factor = 0, 2
    for d in reversed(numeros):
        suma += int(d) * factor
        factor = 2 if factor == 7 else factor + 1
    resto = 11 - (suma % 11)
    esperado = "0" if resto == 11 else "K" if resto == 10 else str(resto)
    return dv.upper() == esperado


def _luhn(numero: str) -> bool:
    digitos = [int(d) for d in re.sub(r"\D", "", numero)]
    if not 13 <= len(digitos) <= 19:
        return False
    suma = 0
    for i, d in enumerate(reversed(digitos)):
        if i % 2:
            d = d * 2 - 9 if d * 2 > 9 else d * 2
        suma += d
    return suma % 10 == 0


def ocultar(texto: str):
    """Devuelve (texto_oculto, conteo) con conteo = {tipo: cantidad}."""
    conteo = {"rut": 0, "correo": 0, "telefono": 0, "tarjeta": 0}
    if not texto:
        return texto, conteo

    def reemplazo(tipo, valido=None):
        def _r(m):
            if valido and not valido(m):
                return m.group(0)
            conteo[tipo] += 1
            return MARCAS[tipo]
        return _r

    # El orden importa: correos antes que teléfonos; tarjetas antes que teléfonos.
    texto = _CORREO.sub(reemplazo("correo"), texto)
    texto = _RUT.sub(reemplazo("rut", lambda m: rut_valido(m.group(1), m.group(2))), texto)
    texto = _TARJETA.sub(reemplazo("tarjeta", lambda m: _luhn(m.group(0))), texto)
    texto = _TELEFONO.sub(reemplazo("telefono"), texto)
    return texto, conteo


def contar(texto: str) -> dict:
    """Cuántos datos personales de cada tipo tiene el texto (sin modificarlo)."""
    return ocultar(texto)[1]


def ocultar_mensajes(mensajes):
    """Oculta los datos personales en los mensajes que se envían a la IA."""
    salida = []
    for m in mensajes or []:
        if isinstance(m, dict) and isinstance(m.get("content"), str):
            m = {**m, "content": ocultar(m["content"])[0]}
        salida.append(m)
    return salida


def describir(conteo: dict) -> str:
    """'3 RUT y 2 correos' a partir del conteo; '' si no hay datos."""
    nombres = {"rut": ("RUT", "RUT"), "correo": ("correo", "correos"),
               "telefono": ("teléfono", "teléfonos"), "tarjeta": ("número de tarjeta", "números de tarjeta")}
    partes = [f"{n} {nombres[t][0] if n == 1 else nombres[t][1]}" for t, n in (conteo or {}).items() if n]
    if not partes:
        return ""
    return partes[0] if len(partes) == 1 else ", ".join(partes[:-1]) + " y " + partes[-1]


# ---- Seudónimos reversibles -------------------------------------------------
# Para lo que se envía a la IA se usan marcas numeradas ([CORREO_1], [RUT_2]...)
# en vez de "[correo oculto]": la IA trabaja con la marca y, al recibir su
# respuesta, la plataforma vuelve a poner el dato original. Así la IA nunca ve
# los datos y un documento generado (por ejemplo, una política con el contacto
# del delegado) queda completo.

_ETIQUETA = {"rut": "RUT", "correo": "CORREO", "telefono": "TELEFONO", "tarjeta": "TARJETA"}
_MARCA_NUMERADA = re.compile(r"\[(RUT|CORREO|TEL[EÉ]FONO|TARJETA)[ _](\d+)\]", re.IGNORECASE)


def seudonimizar(texto: str, mapa: dict) -> str:
    """Reemplaza los datos por marcas numeradas. mapa: {marca: original},
    compartido entre los mensajes de una misma llamada (el mismo dato recibe
    siempre la misma marca)."""
    if not texto:
        return texto
    inverso = {v: k for k, v in mapa.items()}

    def reemplazo(tipo, valido=None):
        def _r(m):
            original = m.group(0)
            if valido and not valido(m):
                return original
            if original in inverso:
                return inverso[original]
            n = sum(1 for k in mapa if k.startswith(f"[{_ETIQUETA[tipo]}_")) + 1
            marca = f"[{_ETIQUETA[tipo]}_{n}]"
            mapa[marca] = original
            inverso[original] = marca
            return marca
        return _r

    texto = _CORREO.sub(reemplazo("correo"), texto)
    texto = _RUT.sub(reemplazo("rut", lambda m: rut_valido(m.group(1), m.group(2))), texto)
    texto = _TARJETA.sub(reemplazo("tarjeta", lambda m: _luhn(m.group(0))), texto)
    texto = _TELEFONO.sub(reemplazo("telefono"), texto)
    return texto


def restaurar(texto: str, mapa: dict) -> str:
    """Vuelve a poner los datos originales en la respuesta de la IA."""
    if not texto or not mapa:
        return texto

    def _r(m):
        tipo = m.group(1).upper().replace("É", "E")
        return mapa.get(f"[{tipo}_{m.group(2)}]", m.group(0))
    return _MARCA_NUMERADA.sub(_r, texto)


def seudonimizar_mensajes(mensajes, mapa: dict):
    salida = []
    for m in mensajes or []:
        if isinstance(m, dict) and isinstance(m.get("content"), str):
            m = {**m, "content": seudonimizar(m["content"], mapa)}
        salida.append(m)
    return salida
