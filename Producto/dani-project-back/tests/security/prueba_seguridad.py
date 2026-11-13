"""Pruebas de seguridad de NormIA contra el sistema en ejecución.

Crea dos empresas de prueba (A y B) con sus usuarios y verifica que:

- una empresa no puede ver ni modificar los datos de otra (RNF-08, RNF-20),
- cada rol solo accede a lo que le corresponde y no puede asignar roles superiores (RNF-06),
- el inicio de sesión no revela si un correo existe y resiste entradas maliciosas (RNF-05),
- las respuestas no exponen contraseñas (RNF-11),
- un usuario suspendido pierde el acceso,
- el inicio de sesión limita los intentos fallidos.

La validación de tokens (firma, expiración, enlace de activación) está en
tests/test_seguridad.py, que no necesita servidor.

Necesita el backend levantado y una base de datos de prueba (nunca la de producción),
porque crea empresas y usuarios. No forma parte de `pytest tests`. Uso:

    cd Producto && docker compose up -d
    cd dani-project-back
    python tests/security/prueba_seguridad.py --url http://localhost:8000 --salida resultados.md
"""
import argparse
import secrets
import sys
from datetime import datetime

import httpx

resultados = []


def registrar(rnf, prueba, esperado, obtenido, ok):
    resultados.append((rnf, prueba, esperado, str(obtenido), ok))
    print(f"[{'OK' if ok else 'FALLA'}] {prueba}: esperado {esperado}, obtenido {obtenido}")


def bearer(token, org=None):
    h = {"Authorization": f"Bearer {token}"}
    if org:
        h["X-Org-Id"] = org
    return h


def main():
    ap = argparse.ArgumentParser(description="Pruebas de seguridad contra un backend en ejecución")
    ap.add_argument("--url", default="http://localhost:8000")
    ap.add_argument("--salida")
    args = ap.parse_args()

    sufijo = datetime.now().strftime("%Y%m%d%H%M%S")
    clave = "Prueba-" + secrets.token_urlsafe(12)
    c = httpx.Client(base_url=args.url, timeout=60)

    # ---------- Preparación: dos empresas con su owner ----------
    owners = {}
    for nombre in ("A", "B"):
        email = f"owner.{nombre.lower()}.{sufijo}@prueba.local"
        r = c.post("/api/auth/register", json={"name": f"Owner {nombre}", "email": email,
                                                "password": clave, "empresa": f"Seguridad {nombre} {sufijo}"})
        r.raise_for_status()
        login = c.post("/api/auth/login", json={"email": email, "password": clave}).json()
        owners[nombre] = {"email": email, "token": login["access_token"], "org": login["organization_id"]}
    A, B = owners["A"], owners["B"]

    # Usuarios de la empresa A: un admin y un empleado
    usuarios = {}
    for rol in ("admin", "employee"):
        email = f"{rol}.a.{sufijo}@prueba.local"
        r = c.post("/api/users/", headers=bearer(A["token"]),
                   json={"full_name": f"{rol} A", "email": email, "password": clave, "role": rol})
        r.raise_for_status()
        token = c.post("/api/auth/login", json={"email": email, "password": clave}).json()["access_token"]
        usuarios[rol] = {"id": r.json()["id"], "email": email, "token": token}

    # Un riesgo de la empresa A
    r = c.post("/api/risks/", headers=bearer(A["token"]), json={
        "title": "Riesgo confidencial de A", "description": "Solo debe verlo la empresa A",
        "likelihood": 3, "impact": 4, "owner": "Owner A"})
    r.raise_for_status()
    riesgo_a = r.json()["id"]

    # ---------- Inicio de sesión ----------
    r1 = c.post("/api/auth/login", json={"email": A["email"], "password": "clave-incorrecta"})
    r2 = c.post("/api/auth/login", json={"email": f"no.existe.{sufijo}@prueba.local", "password": "x"})
    registrar("RNF-05", "Login con contraseña incorrecta", "401", r1.status_code, r1.status_code == 401)
    registrar("RNF-05", "Login con correo inexistente", "401", r2.status_code, r2.status_code == 401)
    mismo = r1.json().get("detail") == r2.json().get("detail")
    registrar("RNF-05", "Mismo mensaje para correo inexistente y contraseña incorrecta (no revela cuentas)",
              "mensajes iguales", "iguales" if mismo else "distintos", mismo)
    r = c.post("/api/auth/login", json={"email": "' OR '1'='1' --", "password": "' OR '1'='1' --"})
    registrar("RNF-05", "Inyección SQL en el login", "401", r.status_code, r.status_code == 401)

    # ---------- Contraseñas no expuestas ----------
    textos = [c.post("/api/auth/login", json={"email": A["email"], "password": clave}).text,
              c.get("/api/users/", headers=bearer(A["token"])).text,
              c.get(f"/api/users/{usuarios['admin']['id']}", headers=bearer(A["token"])).text,
              c.get("/api/auth/me", headers=bearer(A["token"])).text]
    expuesta = any(("hashed_password" in t) or (clave in t) or ("$2b$" in t) for t in textos)
    registrar("RNF-11", "Login y listados de usuarios no incluyen la contraseña ni su hash",
              "sin contraseña", "expuesta" if expuesta else "sin contraseña", not expuesta)

    # ---------- Aislamiento entre empresas ----------
    ids_b = [x["id"] for x in c.get("/api/risks/", headers=bearer(B["token"])).json()]
    registrar("RNF-08", "La empresa B no ve los riesgos de A", "no aparece",
              "aparece" if riesgo_a in ids_b else "no aparece", riesgo_a not in ids_b)
    ids_b2 = [x["id"] for x in c.get("/api/risks/", headers=bearer(B["token"], org=A["org"])).json()]
    registrar("RNF-08", "B envía la cabecera X-Org-Id de A y sigue sin ver sus riesgos", "no aparece",
              "aparece" if riesgo_a in ids_b2 else "no aparece", riesgo_a not in ids_b2)
    r = c.put(f"/api/risks/{riesgo_a}", headers=bearer(B["token"]), json={"title": "Modificado por B"})
    registrar("RNF-08", "B intenta modificar un riesgo de A", "404", r.status_code, r.status_code == 404)
    r = c.delete(f"/api/risks/{riesgo_a}", headers=bearer(B["token"]))
    registrar("RNF-08", "B intenta borrar un riesgo de A", "404", r.status_code, r.status_code == 404)
    sigue = riesgo_a in [x["id"] for x in c.get("/api/risks/", headers=bearer(A["token"])).json()]
    registrar("RNF-08", "El riesgo de A sigue intacto después de los intentos", "existe",
              "existe" if sigue else "borrado", sigue)
    r = c.get(f"/api/users/{usuarios['admin']['id']}", headers=bearer(B["token"]))
    registrar("RNF-08", "B consulta un usuario de A", "404", r.status_code, r.status_code == 404)

    # ---------- Roles ----------
    for rol_nuevo in ("owner", "superadmin"):
        r = c.post("/api/users/", headers=bearer(usuarios["admin"]["token"]), json={
            "full_name": "Escalada", "email": f"escala.{rol_nuevo}.{sufijo}@prueba.local",
            "password": clave, "role": rol_nuevo})
        registrar("RNF-06", f"Un admin intenta crear un usuario {rol_nuevo}", "403", r.status_code, r.status_code == 403)
    emp = bearer(usuarios["employee"]["token"])
    for metodo, ruta in (("GET", "/api/risks/"), ("GET", "/api/breaches/"), ("GET", "/api/users/"),
                         ("GET", "/api/evidence/")):
        r = c.request(metodo, ruta, headers=emp)
        registrar("RNF-06", f"Un empleado accede a {ruta}", "403", r.status_code, r.status_code == 403)

    # ---------- Usuario suspendido ----------
    token_previo = usuarios["employee"]["token"]
    c.put(f"/api/users/{usuarios['employee']['id']}", headers=bearer(A["token"]), json={"is_active": False}).raise_for_status()
    r = c.post("/api/auth/login", json={"email": usuarios["employee"]["email"], "password": clave})
    registrar("Gestión de usuarios", "Un usuario suspendido intenta iniciar sesión", "403", r.status_code,
              r.status_code == 403)
    r = c.get("/api/auth/me", headers=bearer(token_previo))
    registrar("Gestión de usuarios", "Un usuario suspendido usa el token que tenía antes de la suspensión",
              "401 o 403", r.status_code, r.status_code in (401, 403))

    # ---------- Enlace de activación ----------
    r = c.get("/api/auth/me", headers=bearer("x.y.z"))
    registrar("RNF-05", "Token inválido en /api/auth/me", "401", r.status_code, r.status_code == 401)

    # ---------- Fuerza bruta (informativa) ----------
    codigos = [c.post("/api/auth/login", json={"email": A["email"], "password": f"mala-{i}"}).status_code
               for i in range(15)]
    limitado = any(code == 429 for code in codigos)
    registrar("RNF-05", "15 intentos fallidos seguidos de inicio de sesión", "bloqueo o 429",
              "429 tras varios intentos" if limitado else "sin límite (siempre 401)", limitado)

    aprobadas = sum(1 for *_, ok in resultados if ok)
    lineas = [f"Fecha de ejecución: {datetime.now():%Y-%m-%d %H:%M}  ", f"Servidor: {args.url}  ",
              f"Resultado: {aprobadas} de {len(resultados)} pruebas aprobadas", "",
              "| Requisito | Prueba | Esperado | Obtenido | Resultado |", "|---|---|---|---|---|"]
    lineas += [f"| {a} | {b} | {e} | {o} | {'Aprobado' if ok else 'Rechazado'} |" for a, b, e, o, ok in resultados]
    texto = "\n".join(lineas)
    print("\n" + texto)
    if args.salida:
        with open(args.salida, "w", encoding="utf-8") as f:
            f.write(texto + "\n")
    sys.exit(0 if aprobadas == len(resultados) else 1)


if __name__ == "__main__":
    main()
