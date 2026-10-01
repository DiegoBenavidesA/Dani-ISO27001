# run_local.py — SOLO para desarrollo local en Windows. NO se sube al repo.
#
# En Windows, asyncpg (el driver de Postgres) falla con el bucle de eventos
# por defecto (Proactor) durante la negociación SSL. El SelectorEventLoop lo
# resuelve. Este arreglo se aplica aquí, en tiempo de ejecución, para no tener
# que modificar app/main.py (que es compartido con el resto del equipo).
#
# Uso:  (venv311 activado, Docker corriendo)
#   python run_local.py
import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
