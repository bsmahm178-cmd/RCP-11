from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from .database import Base
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False, default="User")

    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)

    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)

class Applicant(Base):
    __tablename__ = "applicants"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, index=True)
    specialization_name = Column(String)
    education_institution = Column(String)
    is_graduate = Column(Boolean, default=False)
    is_employee = Column(Boolean, default=False)
    stage = Column(String, default="applicant")

class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(String, primary_key=True, index=True)
    english_score_percent = Column(Float, default=0)
    technical_score = Column(Float, default=0)
    test_time_index = Column(Float, default=0)
    cheat_score = Column(Float, default=0)

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String, primary_key=True, index=True)

    # Interview information
    cohort = Column(String, nullable=True)
    city = Column(String, nullable=True)
    showed_up = Column(Boolean, default=False)
    commitment = Column(String, nullable=True)
    location = Column(String, nullable=True)

    # Interview evaluation
    general_score = Column(Float, default=0)
    general_accept = Column(String, nullable=True)

    technical_score = Column(Float, default=0)
    technical_accept = Column(String, nullable=True)

    communication_score = Column(Float, default=0)
    total_score = Column(Float, default=0)

    # Interviewer result
    notes = Column(Text, nullable=True)
    recommendation = Column(String, nullable=True)

    # Admin final decision
    decision = Column(String, nullable=True)

    # Assignment and workflow
    assigned_interviewer_email = Column(String, nullable=True)
    interview_status = Column(String, default="pending")

class FinalShortlist(Base):
    __tablename__ = "final_shortlist"

    id = Column(String, primary_key=True, index=True)

    application_cohort = Column(String)
    application_city = Column(String)

    showed_up = Column(Boolean, default=False)
    turned_on_camera = Column(Boolean, default=False)

    graduation = Column(String)
    able_to_commit = Column(String)
    interview_location = Column(String)

    general_score = Column(Float, default=0)
    general_accept = Column(String)

    technical_score = Column(Float, default=0)
    technical_accept = Column(String)

    total_score = Column(Float, default=0)
    decision = Column(String)

    accepted = Column(String)
    offer_letter = Column(String)
    acceptance_confirmation = Column(String)
