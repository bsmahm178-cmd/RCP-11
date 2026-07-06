from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .auth import require_roles
from .database import get_db
from .email_models import EmailLog
from .email_service import send_smtp_email

router = APIRouter(prefix="/emails", tags=["Emails"])

EmailType = Literal[
    "interview_invitation",
    "accepted",
    "backup",
    "rejected",
]


class SendEmailRequest(BaseModel):
    recipient_emails: list[str] = Field(min_length=1)
    email_type: EmailType
    applicant_id: str | None = None
    subject: str = Field(min_length=1, max_length=250)
    body: str = Field(min_length=1)


def _sender_name(user) -> str:
    return (
        getattr(user, "first_name", None)
        or getattr(user, "email", None)
        or "Unknown user"
    )


def _clean_emails(values: list[str]) -> list[str]:
    result: list[str] = []

    for value in values:
        email = str(value).strip().lower()
        if not email:
            continue
        if "@" not in email or "." not in email.split("@")[-1]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid email address: {email}",
            )
        if email not in result:
            result.append(email)

    if not result:
        raise HTTPException(
            status_code=400,
            detail="At least one valid recipient email is required",
        )

    return result


@router.post("/send")
def send_emails(
    payload: SendEmailRequest,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "coordinator")),
):
    role = str(getattr(user, "role", "")).lower()

    if role == "coordinator" and payload.email_type != "interview_invitation":
        raise HTTPException(
            status_code=403,
            detail="Coordinators can only send interview invitations",
        )

    recipients = _clean_emails(payload.recipient_emails)
    sent_count = 0
    failed_count = 0
    results = []

    for recipient in recipients:
        log = EmailLog(
            applicant_id=payload.applicant_id,
            recipient_email=recipient,
            email_type=payload.email_type,
            subject=payload.subject.strip(),
            body=payload.body.strip(),
            status="Pending",
            sent_by=_sender_name(user),
            sent_at=datetime.now(timezone.utc),
        )
        db.add(log)
        db.flush()

        try:
            send_smtp_email(
                recipient_email=recipient,
                subject=payload.subject.strip(),
                body=payload.body.strip(),
            )
            log.status = "Sent"
            log.error_message = None
            sent_count += 1
            results.append(
                {
                    "email": recipient,
                    "status": "Sent",
                }
            )
        except Exception as exc:
            log.status = "Failed"
            log.error_message = str(exc)
            failed_count += 1
            results.append(
                {
                    "email": recipient,
                    "status": "Failed",
                    "error": str(exc),
                }
            )

    db.commit()

    return {
        "message": "Email sending completed",
        "sent_count": sent_count,
        "failed_count": failed_count,
        "results": results,
    }


@router.get("/history")
def get_email_history(
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "coordinator")),
):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)

    query = db.query(EmailLog)

    role = str(getattr(user, "role", "")).lower()
    if role == "coordinator":
        query = query.filter(EmailLog.email_type == "interview_invitation")

    total = query.count()
    rows = (
        query.order_by(EmailLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [
            {
                "id": row.id,
                "applicant_id": row.applicant_id,
                "recipient_email": row.recipient_email,
                "email_type": row.email_type,
                "subject": row.subject,
                "status": row.status,
                "sent_by": row.sent_by,
                "sent_at": row.sent_at,
                "error_message": row.error_message,
            }
            for row in rows
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size if total else 0,
    }
