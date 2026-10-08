import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from app.config import settings


def send_consent_email(
    recipient_email: str,
    recipient_name: str,
    consent_url: str,
) -> None:
    """code .\app\services\email_service.py
    Envía al titular el enlace público para revisar y aceptar
    una solicitud de consentimiento.
    """

    if not settings.SMTP_HOST:
        raise RuntimeError("SMTP_HOST no está configurado.")

    if not settings.SMTP_USER:
        raise RuntimeError("SMTP_USER no está configurado.")

    if not settings.SMTP_PASSWORD:
        raise RuntimeError("SMTP_PASSWORD no está configurado.")

    sender_email = settings.EMAIL_FROM or settings.SMTP_USER
    sender_name = settings.SMTP_FROM_NAME or "GRC"

    message = EmailMessage()
    message["Subject"] = "Solicitud de consentimiento - DANI"
    message["From"] = formataddr((sender_name, sender_email))
    message["To"] = recipient_email

    message.set_content(
        f"""Hola {recipient_name},

Has recibido una solicitud de consentimiento.

Para revisar la información del tratamiento y registrar tu decisión, ingresa al siguiente enlace:

{consent_url}

Si no esperabas esta solicitud, puedes ignorar este mensaje.

Saludos,
{sender_name}
"""
    )

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
        timeout=20,
    ) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(
            settings.SMTP_USER,
            settings.SMTP_PASSWORD,
        )
        smtp.send_message(message)


    print("✅ SMTP: correo enviado correctamente")