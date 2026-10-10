# app/services/email_service.py

import asyncio
import logging
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr

import httpx

from app.config import settings


logger = logging.getLogger(__name__)


# =========================================================
# ENVÍO POR API HTTPS (Brevo)
# Necesario donde el SMTP saliente está bloqueado (ej. Render free).
# =========================================================

def _send_via_brevo(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
    from_name: str | None = None,
) -> bool:
    """Envía un correo vía la API HTTPS de Brevo (puerto 443)."""
    sender_email = settings.EMAIL_FROM or settings.SMTP_USER
    if not sender_email:
        logger.warning("Brevo: falta EMAIL_FROM/SMTP_USER (remitente verificado); se omite el envío.")
        return False

    payload = {
        "sender": {"name": from_name or settings.SMTP_FROM_NAME, "email": sender_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_body,
    }
    if text_body:
        payload["textContent"] = text_body

    try:
        resp = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json",
                "accept": "application/json",
            },
            json=payload,
            timeout=20,
        )
        if resp.status_code in (200, 201):
            logger.info("✉️ Correo enviado vía Brevo a %s", to_email)
            return True
        logger.error("Brevo error %s al enviar a %s: %s", resp.status_code, to_email, resp.text[:300])
        return False
    except Exception:
        logger.exception("Error enviando correo vía Brevo a %s", to_email)
        return False


# =========================================================
# ENVÍO GENÉRICO DE CORREOS
# Usa Brevo (HTTPS) si hay API key; si no, cae a SMTP (local).
# =========================================================

def _send_email_sync(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
    from_name: str | None = None,
) -> bool:
    """Envía un correo de forma síncrona: Brevo si hay key, si no SMTP."""

    # Preferir Brevo (HTTPS) cuando esté configurado.
    if settings.BREVO_API_KEY:
        return _send_via_brevo(to_email, subject, html_body, text_body, from_name)

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP no configurado (SMTP_USER presente=%s, SMTP_PASSWORD presente=%s); "
            "se omite el envío.",
            bool(settings.SMTP_USER),
            bool(settings.SMTP_PASSWORD),
        )
        return False

    remitente = from_name or settings.SMTP_FROM_NAME

    msg = EmailMessage()
    msg["From"] = f"{remitente} <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.set_content(
        text_body or "Este correo requiere un cliente que soporte HTML."
    )
    msg.add_alternative(html_body, subtype="html")

    try:
        context = ssl.create_default_context()

        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=15,
        ) as server:
            server.starttls(context=context)
            server.login(
                settings.SMTP_USER,
                settings.SMTP_PASSWORD,
            )
            server.send_message(msg)

        logger.info("✉️ Correo enviado a %s", to_email)
        return True

    except Exception:
        logger.exception(
            "Error enviando correo SMTP "
            "(host=%s, port=%s, recipient=%s).",
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            to_email,
        )
        return False


async def send_email_async(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
    from_name: str | None = None,
) -> bool:
    """Ejecuta el envío SMTP en un hilo para no bloquear código async."""

    return await asyncio.to_thread(
        _send_email_sync,
        to_email,
        subject,
        html_body,
        text_body,
        from_name,
    )


# =========================================================
# CORREO DE INVITACIÓN / ACTIVACIÓN
# Funcionalidad proveniente de main
# =========================================================

def build_invitation_email(
    owner_name: str,
    org_name: str,
    activation_url: str,
    role_label: str = "Owner",
) -> tuple[str, str]:
    """Devuelve el contenido HTML y texto del correo de invitación."""

    html = f"""\
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">DANI GRC</h1>
  </div>

  <div style="border: 1px solid #e2e8f0; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">
      Hola <strong>{owner_name}</strong>,
    </p>

    <p style="font-size: 15px; line-height: 1.6;">
      Fuiste invitado a la organización <strong>{org_name}</strong>
      con el rol de <strong>{role_label}</strong>
      en la plataforma de cumplimiento GRC.
    </p>

    <p style="font-size: 15px; line-height: 1.6;">
      Haz clic en el botón para activar tu cuenta y definir tu contraseña:
    </p>

    <p style="text-align: center; margin: 28px 0;">
      <a
        href="{activation_url}"
        style="background: #10b981; color: white; text-decoration: none;
        padding: 14px 28px; border-radius: 10px; font-weight: bold;
        display: inline-block;"
      >
        Activar mi cuenta
      </a>
    </p>

    <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
      <a
        href="{activation_url}"
        style="color: #10b981; word-break: break-all;"
      >
        {activation_url}
      </a>
    </p>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
      Este enlace caduca en 7 días.
      Si no esperabas esta invitación, ignora este correo.
    </p>
  </div>
</div>
"""

    text = (
        f"Hola {owner_name},\n\n"
        f"Fuiste invitado a la organización {org_name} "
        f"con el rol de {role_label} en la plataforma DANI GRC.\n\n"
        f"Activa tu cuenta y define tu contraseña aquí:\n"
        f"{activation_url}\n\n"
        f"Este enlace caduca en 7 días."
    )

    return html, text


# =========================================================
# CORREO DE CONSENTIMIENTO
# Funcionalidad de gestión de consentimientos
# =========================================================

def send_consent_email(
    recipient_email: str,
    recipient_name: str,
    consent_url: str,
    requests_url: str | None = None,
) -> bool:
    """
    Envía al titular el enlace público para revisar y aceptar una solicitud de
    consentimiento. Usa el mismo núcleo (Brevo/SMTP). Devuelve True si se envió.
    """
    sender_name = settings.SMTP_FROM_NAME or "DANI GRC"

    bloque_derechos_txt = ""
    bloque_derechos_html = ""
    if requests_url:
        bloque_derechos_txt = (
            "\n¿Quieres revocar tu consentimiento o ejercer otros derechos "
            "sobre tus datos (acceso, rectificación, eliminación)?\n"
            f"Puedes hacerlo aquí en cualquier momento:\n\n{requests_url}\n"
        )
        bloque_derechos_html = (
            f'<p style="font-size:14px;line-height:1.6;">¿Quieres revocar tu consentimiento o '
            f'ejercer otros derechos sobre tus datos (acceso, rectificación, eliminación)? '
            f'Puedes hacerlo aquí en cualquier momento:<br>'
            f'<a href="{requests_url}" style="color:#10b981;word-break:break-all;">{requests_url}</a></p>'
        )

    text_body = (
        f"Hola {recipient_name},\n\n"
        f"Has recibido una solicitud de consentimiento.\n\n"
        f"Para revisar la información del tratamiento y registrar tu decisión, "
        f"ingresa al siguiente enlace:\n\n{consent_url}\n"
        f"{bloque_derechos_txt}\n"
        f"Si no esperabas esta solicitud, puedes ignorar este mensaje.\n\n"
        f"Saludos,\n{sender_name}\n"
    )

    html_body = f"""\
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
  <p style="font-size:16px;">Hola <strong>{recipient_name}</strong>,</p>
  <p style="font-size:15px;line-height:1.6;">Has recibido una solicitud de consentimiento.
  Revisa la información del tratamiento y registra tu decisión:</p>
  <p style="text-align:center;margin:24px 0;">
    <a href="{consent_url}" style="background:#10b981;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;display:inline-block;">Revisar y decidir</a>
  </p>
  {bloque_derechos_html}
  <p style="font-size:12px;color:#94a3b8;margin-top:20px;">Si no esperabas esta solicitud, ignora este mensaje.</p>
</div>
"""

    return _send_email_sync(
        recipient_email,
        "Solicitud de consentimiento - DANI",
        html_body,
        text_body,
    )