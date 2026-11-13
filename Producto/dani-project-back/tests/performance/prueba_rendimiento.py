"""Pruebas de rendimiento de la API de NormIA.

Mide tiempos de respuesta contra un backend en ejecución y los compara con los
requisitos no funcionales (docs/tecnico/Requisitos_No_Funcionales.md):

- RNF-13: GET /health responde 200.
- RNF-01: el 95 % de los GET sin IA responde en menos de 2 s (100 solicitudes seguidas).
- RNF-17: con 20 lecturas concurrentes, el percentil 95 queda bajo 5 s.

No forma parte de `pytest tests` porque necesita el servidor levantado. Uso:

    # 1. Levantar el sistema:   cd Producto && docker compose up -d
    # 2. Ejecutar (desde Producto/dani-project-back):
    PERF_EMAIL=superadmin@normia.local PERF_PASSWORD=cambiar-esta-clave \
        python tests/performance/prueba_rendimiento.py --url http://localhost:8000

Las credenciales se leen de variables de entorno para no dejarlas en el código.
Si el usuario es superadmin y no se indica --org-id, el script crea una empresa
de prueba y registra riesgos de ejemplo para que los listados tengan datos.
"""
import argparse
import asyncio
import os
import statistics
import sys
import time
from datetime import datetime

import httpx

ENDPOINTS_LECTURA = [
    "/api/risks/",
    "/api/breaches/",
    "/api/assessment-questions/",
    "/api/notifications/",
    "/api/capas/",
    "/api/evidence/",
    "/api/gap-analysis/score",
]

LIMITE_RNF01 = 2.0   # segundos, p95 de lecturas secuenciales
LIMITE_RNF17 = 5.0   # segundos, p95 con concurrencia


def percentil(valores, p):
    """Percentil por el método del rango más cercano."""
    orden = sorted(valores)
    k = max(0, min(len(orden) - 1, int(round(p / 100 * len(orden) + 0.5)) - 1))
    return orden[k]


def resumen(tiempos):
    return {
        "n": len(tiempos),
        "p50": statistics.median(tiempos),
        "p95": percentil(tiempos, 95),
        "max": max(tiempos),
    }


async def medir(cliente, metodo, ruta, **kw):
    inicio = time.perf_counter()
    r = await cliente.request(metodo, ruta, **kw)
    return time.perf_counter() - inicio, r.status_code


async def secuencial(cliente, ruta, n, headers=None):
    tiempos, errores = [], 0
    for _ in range(n):
        t, codigo = await medir(cliente, "GET", ruta, headers=headers)
        tiempos.append(t)
        errores += codigo >= 400
    return tiempos, errores


async def concurrente(cliente, rutas, concurrencia, rondas, headers):
    tiempos, errores = [], 0
    for ronda in range(rondas):
        tareas = [medir(cliente, "GET", rutas[(ronda + i) % len(rutas)], headers=headers)
                  for i in range(concurrencia)]
        for t, codigo in await asyncio.gather(*tareas):
            tiempos.append(t)
            errores += codigo >= 400
    return tiempos, errores


async def preparar_empresa(cliente, headers, riesgos):
    nombre = f"Prueba rendimiento {datetime.now():%Y%m%d-%H%M%S}"
    r = await cliente.post("/api/organizations/", json={"nombre": nombre}, headers=headers)
    r.raise_for_status()
    org_id = r.json()["id"]
    h = {**headers, "X-Org-Id": org_id}
    for i in range(riesgos):
        await cliente.post("/api/risks/", headers=h, json={
            "title": f"Riesgo de prueba {i + 1}",
            "description": "Riesgo generado por la prueba de rendimiento",
            "likelihood": (i % 5) + 1, "impact": ((i * 2) % 5) + 1, "owner": "Equipo de pruebas"})
    return org_id, nombre


async def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--url", default="http://localhost:8000")
    ap.add_argument("--n", type=int, default=100, help="solicitudes secuenciales por endpoint")
    ap.add_argument("--concurrencia", type=int, default=20)
    ap.add_argument("--rondas", type=int, default=5)
    ap.add_argument("--org-id", help="empresa a usar (si no, se crea una de prueba)")
    ap.add_argument("--riesgos", type=int, default=50, help="riesgos de ejemplo en la empresa de prueba")
    ap.add_argument("--salida", help="archivo Markdown donde guardar los resultados")
    args = ap.parse_args()

    email, clave = os.environ.get("PERF_EMAIL"), os.environ.get("PERF_PASSWORD")
    if not email or not clave:
        sys.exit("Define PERF_EMAIL y PERF_PASSWORD con un usuario de prueba.")

    filas, aprobado = [], True
    async with httpx.AsyncClient(base_url=args.url, timeout=60) as cliente:
        # RNF-13: health
        t_health, err_health = await secuencial(cliente, "/health", args.n)
        r = await cliente.get("/health")
        ok13 = r.status_code == 200 and r.json() == {"status": "healthy"} and err_health == 0
        filas.append(("RNF-13", "GET /health", resumen(t_health), err_health, "200 y healthy", ok13))

        # Inicio de sesión (referencia: incluye el hash bcrypt de la contraseña)
        t_login = []
        for _ in range(10):
            t, codigo = await medir(cliente, "POST", "/api/auth/login", json={"email": email, "password": clave})
            if codigo != 200:
                sys.exit(f"No se pudo iniciar sesión (HTTP {codigo}).")
            t_login.append(t)
        r = await cliente.post("/api/auth/login", json={"email": email, "password": clave})
        datos = r.json()
        headers = {"Authorization": f"Bearer {datos['access_token']}"}
        filas.append(("Referencia", "POST /api/auth/login", resumen(t_login), 0, "sin límite definido", True))

        org_id, nombre_org = args.org_id, None
        rol = datos.get("role")
        if not org_id and rol == "superadmin":
            org_id, nombre_org = await preparar_empresa(cliente, headers, args.riesgos)
        if org_id:
            headers["X-Org-Id"] = org_id

        # RNF-01: lecturas secuenciales
        todos = []
        for ruta in ENDPOINTS_LECTURA:
            t, err = await secuencial(cliente, ruta, args.n, headers)
            todos += t
            ok = percentil(t, 95) < LIMITE_RNF01 and err == 0
            aprobado &= ok
            filas.append(("RNF-01", f"GET {ruta}", resumen(t), err, f"p95 < {LIMITE_RNF01:.0f} s", ok))

        # RNF-17: concurrencia
        t, err = await concurrente(cliente, ENDPOINTS_LECTURA, args.concurrencia, args.rondas, headers)
        ok17 = percentil(t, 95) < LIMITE_RNF17 and err == 0
        filas.append(("RNF-17", f"{args.concurrencia} lecturas concurrentes x {args.rondas} rondas",
                      resumen(t), err, f"p95 < {LIMITE_RNF17:.0f} s", ok17))
        aprobado &= ok13 and ok17

    lineas = [
        f"Fecha: {datetime.now():%Y-%m-%d %H:%M}  ",
        f"Servidor: {args.url}  ",
        f"Empresa de prueba: {nombre_org or org_id or 'la del usuario'}"
        + (f" ({args.riesgos} riesgos de ejemplo)" if nombre_org else ""),
        "",
        "| Requisito | Prueba | Solicitudes | p50 (ms) | p95 (ms) | Máx (ms) | Errores | Criterio | Resultado |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for req, prueba, s, err, criterio, ok in filas:
        lineas.append(f"| {req} | {prueba} | {s['n']} | {s['p50'] * 1000:.0f} | {s['p95'] * 1000:.0f} | "
                      f"{s['max'] * 1000:.0f} | {err} | {criterio} | {'Aprobado' if ok else 'Rechazado'} |")
    lineas.append("")
    lineas.append(f"Resultado general: {'APROBADO' if aprobado else 'RECHAZADO'}")
    texto = "\n".join(lineas)
    print(texto)
    if args.salida:
        with open(args.salida, "w", encoding="utf-8") as f:
            f.write(texto + "\n")
    sys.exit(0 if aprobado else 1)


if __name__ == "__main__":
    asyncio.run(main())
