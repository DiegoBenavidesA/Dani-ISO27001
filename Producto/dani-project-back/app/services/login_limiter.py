"""Límite de intentos fallidos de inicio de sesión (protección contra fuerza bruta).

Cuenta los fallos por combinación de IP y correo dentro de una ventana de tiempo.
Al llegar al máximo, el login responde 429 hasta que pase la ventana. Se guarda
en memoria: basta para un solo proceso (como el despliegue actual en Render);
con varios procesos habría que moverlo a un almacenamiento compartido.
"""
import time
from collections import deque
from threading import Lock


class LimitadorLogin:
    def __init__(self, max_intentos: int = 5, ventana_segundos: int = 15 * 60):
        self.max_intentos = max_intentos
        self.ventana = ventana_segundos
        self._fallos: dict[str, deque] = {}
        self._lock = Lock()

    def _vigentes(self, clave: str, ahora: float) -> deque:
        fallos = self._fallos.get(clave, deque())
        while fallos and ahora - fallos[0] > self.ventana:
            fallos.popleft()
        return fallos

    def segundos_de_bloqueo(self, clave: str) -> int:
        """0 si puede intentar; si no, los segundos que faltan para desbloquear."""
        with self._lock:
            ahora = time.monotonic()
            fallos = self._vigentes(clave, ahora)
            if len(fallos) < self.max_intentos:
                return 0
            return max(1, int(self.ventana - (ahora - fallos[0])))

    def registrar_fallo(self, clave: str) -> None:
        with self._lock:
            ahora = time.monotonic()
            fallos = self._vigentes(clave, ahora)
            fallos.append(ahora)
            self._fallos[clave] = fallos

    def limpiar(self, clave: str) -> None:
        with self._lock:
            self._fallos.pop(clave, None)


limitador_login = LimitadorLogin()
