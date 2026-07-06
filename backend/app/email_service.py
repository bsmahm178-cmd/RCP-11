import os
import smtplib
from pathlib import Path
from email.message import EmailMessage
from email.utils import formataddr

from dotenv import load_dotenv


# المسار الثابت لملف backend/.env
ENV_PATH = (
    Path(__file__).resolve().parents[1]
    / ".env"
)

load_dotenv(
    dotenv_path=ENV_PATH,
    override=True,
)


def send_smtp_email(
    recipient_email: str,
    subject: str,
    body: str,
) -> None:
    smtp_host = os.getenv(
        "SMTP_HOST",
        "smtp.gmail.com",
    ).strip()

    smtp_port = int(
        os.getenv("SMTP_PORT", "465")
    )

    smtp_email = os.getenv(
        "SMTP_EMAIL",
        "",
    ).strip()

    smtp_password = (
        os.getenv(
            "SMTP_APP_PASSWORD",
            "",
        )
        .replace(" ", "")
        .strip()
    )

    from_name = (
        os.getenv(
            "SMTP_FROM_NAME",
            "FLOWIN Admissions",
        ).strip()
        or "FLOWIN Admissions"
    )

    if not smtp_email:
        raise RuntimeError(
            "SMTP_EMAIL is missing from backend/.env"
        )

    if not smtp_password:
        raise RuntimeError(
            "SMTP_APP_PASSWORD is missing from backend/.env"
        )

    message = EmailMessage()

    message["From"] = formataddr(
        (from_name, smtp_email)
    )

    message["To"] = recipient_email
    message["Subject"] = subject

    message.set_content(body)

    with smtplib.SMTP_SSL(
        smtp_host,
        smtp_port,
        timeout=30,
    ) as server:
        server.login(
            smtp_email,
            smtp_password,
        )

        server.send_message(message)
