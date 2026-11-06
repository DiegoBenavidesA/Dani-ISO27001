# Requisitos No Funcionales (RNF) - NormIA

Este documento describe los atributos de calidad del sistema NormIA, garantizando su correcta operación bajo la arquitectura de React (Frontend), FastAPI (Backend) y PostgreSQL (Neon).

## 1. Rendimiento
* **RNF-01 (Tiempo de respuesta de la API):** El 95% de las peticiones a la API en FastAPI deben responder en menos de 500 ms bajo carga normal, excluyendo las peticiones que dependen de la API de Groq (IA).
* **RNF-02 (Tiempo de carga del Frontend):** El tiempo de carga inicial (FCP - First Contentful Paint) de la aplicación React desplegada en Vercel no debe superar los 2 segundos en conexiones de banda ancha (4G/WIFI).

## 2. Seguridad
* **RNF-03 (Autenticación y Autorización):** El sistema debe utilizar tokens JWT (JSON Web Tokens) para la gestión de sesiones. Los tokens deben tener un tiempo de expiración definido y firmarse con una clave secreta fuerte.
* **RNF-04 (Encriptación de contraseñas):** Todas las contraseñas de los usuarios deben almacenarse en la base de datos PostgreSQL utilizando algoritmos de hashing seguros (ej. bcrypt), nunca en texto plano.
* **RNF-05 (Seguridad en tránsito):** Toda comunicación entre el frontend (Vercel) y el backend (Render) debe estar cifrada mediante HTTPS/TLS 1.2 o superior.

## 3. Disponibilidad
* **RNF-06 (Uptime):** El sistema debe apuntar a una disponibilidad del 99.9% (excluyendo ventanas de mantenimiento programadas), apalancándose en la infraestructura cloud de Render, Vercel y Neon.

## 4. Escalabilidad
* **RNF-07 (Backend Stateless):** El backend en FastAPI debe ser *stateless* (sin estado), permitiendo el escalado horizontal en Render sin pérdida de sesiones de usuario.
* **RNF-08 (Conexiones a Base de Datos):** El sistema debe soportar un pool de conexiones asíncronas hacia PostgreSQL (Neon) utilizando SQLAlchemy async, para manejar múltiples peticiones concurrentes de manera eficiente.

## 5. Usabilidad
* **RNF-09 (Diseño Responsivo):** La interfaz de usuario en React debe adaptarse y funcionar correctamente en resoluciones de pantalla de escritorio (1024px o superior) y estar preparada para futuras adaptaciones móviles.
* **RNF-10 (Retroalimentación al usuario):** Toda acción destructiva o de configuración crítica (ej. aplicar auto-remediación de controles) debe requerir una confirmación explícita del usuario.

## 6. Mantenibilidad
* **RNF-11 (Documentación de la API):** El backend debe autogenerar y exponer su documentación técnica mediante Swagger UI (OpenAPI) en el entorno de desarrollo para facilitar la integración.
* **RNF-12 (Estructura de Código):** El código debe seguir una arquitectura limpia, separando claramente los modelos de base de datos (SQLAlchemy), esquemas de validación (Pydantic) y los controladores (Routers).

## 7. Cumplimiento Legal y Normativo
* **RNF-13 (Alineación Ley 21.719):** El diseño de la base de datos debe contemplar la separación lógica multiempresa (tenant) y roles (DPO, Admin, etc.) para garantizar la confidencialidad requerida por la nueva Ley de Protección de Datos Personales de Chile.
* **RNF-14 (Trazabilidad ISO 27001):** Toda modificación crítica a los controles, políticas o análisis de impacto (RoPA) debe quedar registrada (log) con el ID del usuario y la marca de tiempo, para facilitar las auditorías de la norma ISO 27001.