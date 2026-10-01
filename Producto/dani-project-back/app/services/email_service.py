# app/services/email_service.py
"""Envío de correos vía SMTP (Gmail gratis con App Password).

No requiere librerías externas: usa smtplib de la stdlib. El envío es
bloqueante, así que desde código async se llama con `await asyncio.to_thread(...)`
o usando la función async `send_email_async` de abajo.
"""
import smtplib
import ssl
import asyncio
import logging
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)


def _send_email_sync(to_email: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    """Envía un correo de forma síncrona. Devuelve True si se envió."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP no configurado (SMTP_USER/SMTP_PASSWORD vacíos); se omite el envío.")
        return False

    msg = EmailMessage()
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(text_body or "Este correo requiere un cliente que soporte HTML.")
    msg.add_alternative(html_body, subtype="html")

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls(context=context)
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"✉️  Correo enviado a {to_email}")
        return True
    except Exception as e:
        logger.error(f"Error enviando correo a {to_email}: {e}")
        return False


async def send_email_async(to_email: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    """Versión async: corre el envío bloqueante en un hilo aparte."""
    return await asyncio.to_thread(_send_email_sync, to_email, subject, html_body, text_body)


def build_invitation_email(owner_name: str, org_name: str, activation_url: str, role_label: str = "Owner") -> tuple[str, str]:
    """Devuelve (html, texto) del correo de invitación para el usuario."""
    html = f"""\
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">DANI GRC</h1>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hola <strong>{owner_name}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.6;">
      Fuiste invitado a la organización <strong>{org_name}</strong> con el rol de
      <strong>{role_label}</strong> en la plataforma de cumplimiento GRC.
    </p>
    <p style="font-size: 15px; line-height: 1.6;">
      Haz clic en el botón para activar tu cuenta y definir tu contraseña:
    </p>
    <p style="text-align: center; margin: 28px 0;">
      <a href="{activation_url}" style="background: #10b981; color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; display: inline-block;">
        Activar mi cuenta
      </a>
    </p>
    <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
      <a href="{activation_url}" style="color: #10b981; word-break: break-all;">{activation_url}</a>
    </p>
    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
      Este enlace caduca en 7 días. Si no esperabas esta invitación, ignora este correo.
    </p>
  </div>
</div>
"""
    text = (
        f"Hola {owner_name},\n\n"
        f"Fuiste invitado a la organización {org_name} con el rol de {role_label} "
        f"en la plataforma DANI GRC.\n\n"
        f"Activa tu cuenta y define tu contraseña aquí:\n{activation_url}\n\n"
        f"Este enlace caduca en 7 días."
    )
    return html, text
