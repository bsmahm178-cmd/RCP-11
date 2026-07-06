from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text

from .database import Base


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(String, nullable=True, index=True)
    recipient_email = Column(String, nullable=False, index=True)
    email_type = Column(String, nullable=False, index=True)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="Pending", index=True)
    sent_by = Column(String, nullable=True)
    sent_at = Column(
        DateTime(timezone=True),
        nullable=True,
        default=lambda: datetime.now(timezone.utc),
    )
    error_message = Column(Text, nullable=True)
