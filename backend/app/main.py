
import os
import shutil


from fastapi import (
    FastAPI,
    Depends,
    UploadFile,
    File,
    HTTPException,
    Body,
)

from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from .email_routes import router as email_router


from .users_routes import router as users_router







from .database import Base, engine, get_db
from .models import (
    User,
    Applicant,
    Assessment,
    Interview,
    FinalShortlist,
)
from .schemas import UserResponse
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    require_roles,
    get_current_user,
)
from .import_excel import import_workbook


# إنشاء الجداول غير الموجودة
Base.metadata.create_all(bind=engine)


# إنشاء تطبيق FastAPI مرة واحدة فقط
app = FastAPI(title="Admission Workflow API")
app.include_router(users_router)

# إعداد CORS مرة واحدة فقط
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(email_router)





@app.get("/")
def home():
    return {
        "message": "Admission Workflow API",
        "docs": "/docs",
    }


# =========================================================
# Default users
# =========================================================

def seed_users(db: Session):
    default_users = [
        {
            "first_name": "Admin",
            "last_name": "User",
            "username": "admin",
            "email": "admin@flowin.com",
            "password": "admin123",
            "role": "admin",
        },
        {
            "first_name": "Coordinator",
            "last_name": "User",
            "username": "coordinator",
            "email": "coordinator@flowin.com",
            "password": "coord123",
            "role": "coordinator",
        },
        {
            "first_name": "Rafa",
            "last_name": "Interviewer",
            "username": "rafa",
            "email": "rafa@flowin.com",
            "password": "inter123",
            "role": "interviewer",
        },
        {
            "first_name": "Mohammed",
            "last_name": "Interviewer",
            "username": "mohammed",
            "email": "mohammed@flowin.com",
            "password": "inter123",
            "role": "interviewer",
        },
        {
            "first_name": "Nora",
            "last_name": "Interviewer",
            "username": "nora",
            "email": "nora@flowin.com",
            "password": "inter123",
            "role": "interviewer",
        },
    ]

    for item in default_users:
        user = (
            db.query(User)
            .filter(
                or_(
                    User.email == item["email"],
                    User.username == item["username"],
                )
            )
            .first()
        )

        if user:
            user.first_name = item["first_name"]
            user.last_name = item["last_name"]
            user.username = item["username"]
            user.email = item["email"]
            user.role = item["role"]

        else:
            db.add(
                User(
                    first_name=item["first_name"],
                    last_name=item["last_name"],
                    username=item["username"],
                    email=item["email"],
                    password_hash=hash_password(item["password"]),
                    role=item["role"],
                )
            )

    db.commit()


@app.on_event("startup")
def startup():
    from .database import SessionLocal

    db = SessionLocal()

    try:
        seed_users(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# =========================================================
# Authentication
# =========================================================

@app.post("/auth/login")
def login(
    payload: dict,
    db: Session = Depends(get_db),
):
    first_name = str(
        payload.get("first_name", "")
    ).strip()

    password = str(
        payload.get("password", "")
    )

    role = str(
        payload.get("role", "")
    ).strip().lower()

    if not first_name or not password or not role:
        raise HTTPException(
            status_code=400,
            detail=(
                "First name, password, and role are required"
            ),
        )

    allowed_roles = [
        "admin",
        "coordinator",
        "interviewer",
    ]

    if role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role",
        )

    user = (
        db.query(User)
        .filter(
            func.lower(User.first_name)
            == first_name.lower(),
            User.role == role,
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Wrong first name, password, or role",
        )

    if not verify_password(
        password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Wrong first name, password, or role",
        )

    access_token = create_access_token(
        {
            "sub": user.email.lower(),
            "role": user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "first_name": user.first_name,
        "role": user.role,
    }


@app.post(
    "/auth/register",
    response_model=UserResponse,
)
def register(
    payload: dict,
    db: Session = Depends(get_db),
):
    first_name = str(
        payload.get("first_name", "")
    ).strip()

    last_name = str(
        payload.get("last_name", "")
    ).strip()

    email = str(
        payload.get("email", "")
    ).strip().lower()

    password = str(
        payload.get("password", "")
    )

    role = str(
        payload.get("role", "")
    ).strip().lower()

    if not all([
        first_name,
        last_name,
        email,
        password,
        role,
    ]):
        raise HTTPException(
            status_code=400,
            detail="All registration fields are required",
        )

    if role not in [
        "coordinator",
        "interviewer",
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                "You can only register as "
                "Coordinator or Interviewer"
            ),
        )

    existing_email = (
        db.query(User)
        .filter(
            func.lower(User.email) == email
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    # توليد username تلقائيًا من الإيميل
    username_base = email.split("@")[0]
    username = username_base
    counter = 1

    while (
        db.query(User)
        .filter(User.username == username)
        .first()
    ):
        username = f"{username_base}{counter}"
        counter += 1

    new_user = User(
        first_name=first_name,
        last_name=last_name,
        username=username,
        email=email,
        password_hash=hash_password(password),
        role=role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.get("/me")
def me(
    user=Depends(get_current_user),
):
    return {
        "first_name": user.first_name,
        "role": user.role,
    }


# =========================================================
# Excel import
# =========================================================

@app.post("/import-excel")
def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(
        require_roles(
            "admin",
            "coordinator",
        )
    ),
):
    try:
        os.makedirs(
            "uploads",
            exist_ok=True,
        )

        path = os.path.join(
            "uploads",
            file.filename,
        )

        with open(path, "wb") as buffer:
            shutil.copyfileobj(
                file.file,
                buffer,
            )

        result = import_workbook(
            path,
            db,
        )

        return {
            "message": "Excel imported",
            "counts": result,
        }

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@app.post("/seed-sample")
def seed_sample(
    db: Session = Depends(get_db),
    user=Depends(
        require_roles(
            "admin",
            "coordinator",
        )
    ),
):
    try:
        result = import_workbook(
            "Admission_Workflow_Sample_Data.xlsx",
            db,
        )

        return {
            "message": "Sample imported",
            "counts": result,
        }

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# Dashboard
# =========================================================

@app.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    user=Depends(
        require_roles(
            "admin",
            "coordinator",
        )
    ),
):
    decisions = (
        db.query(
            FinalShortlist.decision,
            func.count(FinalShortlist.id),
        )
        .group_by(FinalShortlist.decision)
        .all()
    )

    cities = (
        db.query(
            Interview.city,
            func.count(Interview.id),
        )
        .group_by(Interview.city)
        .order_by(
            func.count(Interview.id).desc()
        )
        .limit(6)
        .all()
    )

    return {
        "applicants": db.query(Applicant).count(),
        "assessments": db.query(Assessment).count(),
        "interviews": db.query(Interview).count(),
        "shortlisted": db.query(
            FinalShortlist
        ).count(),
        "decisions": dict(decisions),
        "top_cities": dict(cities),
    }


# =========================================================
# Shared pagination
# =========================================================

def list_query(
    db,
    model,
    search=None,
    decision=None,
    page=1,
    page_size=20,
):
    query = db.query(model)

    if decision and hasattr(model, "decision"):
        query = query.filter(
            model.decision == decision
        )

    if search:
        query = query.filter(
            model.id.contains(search)
        )

    total = query.count()

    items = (
        query
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (
            total + page_size - 1
        ) // page_size,
    }


# =========================================================
# Applicants
# =========================================================

@app.get("/applicants")
def applicants(
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    user=Depends(
        require_roles(
            "admin",
            "coordinator",
        )
    ),
):
    return list_query(
        db,
        Applicant,
        search,
        None,
        page,
        page_size,
    )


@app.patch(
    "/applicants/move-to-assessment"
)
def move_applicants_to_assessment(
    applicant_ids: list[str] = Body(...),
    db: Session = Depends(get_db),
    user=Depends(
        require_roles(
            "admin",
            "coordinator",
        )
    ),
):
    applicants_list = (
        db.query(Applicant)
        .filter(
            Applicant.id.in_(applicant_ids)
        )
        .all()
    )

    if not applicants_list:
        raise HTTPException(
            status_code=404,
            detail="No applicants found",
        )

    for applicant in applicants_list:
        applicant.stage = "assessment"

    db.commit()

    return {
        "message": (
            "Applicants moved to assessment"
        ),
        "count": len(applicants_list),
    }


@app.patch(
    "/applicants/move-to-interview"
)
def move_applicants_to_interview(
    applicant_ids: list[str] = Body(...),
    db: Session = Depends(get_db),
    user=Depends(
        require_roles(
            "admin",
            "coordinator",
        )
    ),
):
    applicants_list = (
        db.query(Applicant)
        .filter(
            Applicant.id.in_(applicant_ids)
        )
        .all()
    )

    if not applicants_list:
        raise HTTPException(
            status_code=404,
            detail="No applicants found",
        )

    for applicant in applicants_list:
        applicant.stage = "interview"

        existing_interview = (
            db.query(Interview)
            .filter(
                Interview.id == applicant.id
            )
            .first()
        )

        if not existing_interview:
            db.add(
                Interview(
                    id=applicant.id,
                    cohort=None,
                    city=None,
                    showed_up=False,
                    commitment=None,
                    location=None,
                    general_score=0,
                    general_accept=None,
                    technical_score=0,
                    technical_accept=None,
                    communication_score=0,
                    total_score=0,
                    decision=None,
                    notes=None,
                    recommendation=None,
                    assigned_interviewer_email=None,
                    interview_status="pending",
                )
            )

    db.commit()

    return {
        "message": (
            "Applicants moved to interview"
        ),
        "count": len(applicants_list),
    }


# =========================================================
# Assessments
# =========================================================

@app.get("/assessments")
def assessments(
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
    min_english: float | None = None,
    min_technical: float | None = None,
    max_cheat: float | None = None,
    db: Session = Depends(get_db),
    user=Depends(
        require_roles(
            "admin",
            "coordinator",
        )
    ),
):
    query = db.query(Assessment)

    if search:
        query = query.filter(
            Assessment.id.contains(search)
        )

    if min_english is not None:
        query = query.filter(
            Assessment.english_score_percent
            >= min_english / 100
        )

    if min_technical is not None:
        query = query.filter(
            Assessment.technical_score
            >= min_technical / 100
        )

    if max_cheat is not None:
        query = query.filter(
            Assessment.cheat_score
            <= max_cheat
        )

    total = query.count()

    items = (
        query
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (
            total + page_size - 1
        ) // page_size,
    }


@app.patch(
    "/assessments/move-qualified-to-interview"
)
def move_qualified_to_interview(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    user=Depends(
        require_roles(
            "admin",
            "coordinator",
        )
    ),
):
    min_english = float(
        payload.get("min_english", 70)
    )

    min_technical = float(
        payload.get("min_technical", 80)
    )

    max_cheat = float(
        payload.get("max_cheat", 0)
    )

    qualified_assessments = (
        db.query(Assessment)
        .filter(
            Assessment.english_score_percent
            >= min_english / 100,
            Assessment.technical_score
            >= min_technical / 100,
            Assessment.cheat_score
            <= max_cheat,
        )
        .all()
    )

    moved_count = 0

    for assessment in qualified_assessments:
        applicant = (
            db.query(Applicant)
            .filter(
                Applicant.id == assessment.id
            )
            .first()
        )

        if not applicant:
            continue

        applicant.stage = "interview"

        existing_interview = (
            db.query(Interview)
            .filter(
                Interview.id == applicant.id
            )
            .first()
        )

        if not existing_interview:
            db.add(
                Interview(
                    id=applicant.id,
                    cohort=None,
                    city=None,
                    showed_up=False,
                    commitment=None,
                    location=None,
                    general_score=0,
                    general_accept=None,
                    technical_score=0,
                    technical_accept=None,
                    communication_score=0,
                    total_score=0,
                    decision=None,
                    notes=None,
                    recommendation=None,
                    assigned_interviewer_email=None,
                    interview_status="pending",
                )
            )

        moved_count += 1

    db.commit()

    return {
        "message": (
            "Qualified applicants moved to interview"
        ),
        "count": moved_count,
    }


# =========================================================
# Interviews for Admin and Coordinator
# =========================================================

@app.get("/users/interviewers")
def get_interviewers(
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "coordinator")),
):
    interviewers = (
        db.query(User)
        .filter(User.role == "interviewer")
        .order_by(User.first_name)
        .all()
    )

    return [
        {
            "id": interviewer.id,
            "first_name": interviewer.first_name,
            "email": interviewer.email,
            "role": interviewer.role,
        }
        for interviewer in interviewers
    ]

@app.get("/interviews")
def interviews(
    search: str | None = None,
    decision: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    user=Depends(
        require_roles(
            "admin",
            "coordinator",
        )
    ),
):
    return list_query(
        db,
        Interview,
        search,
        decision,
        page,
        page_size,
    )


@app.patch("/interviews/{item_id}")
def update_interview(
    item_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(
        require_roles(
            "admin",
            "coordinator",
        )
    ),
):
    interview = (
        db.query(Interview)
        .filter(Interview.id == item_id)
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    allowed_fields = [
        "general_score",
        "technical_score",
        "communication_score",
        "decision",
        "notes",
        "recommendation",
        "interview_status",
    ]

    for key in allowed_fields:
        if key in payload:
            setattr(
                interview,
                key,
                payload[key],
            )

    db.commit()
    db.refresh(interview)

    return interview


# =========================================================
# Interviewers
# =========================================================




@app.patch(
    "/interviews/{item_id}/assign"
)
def assign_interviewer(
    item_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(
        require_roles(
            "admin",
            "coordinator",
        )
    ),
):
    interviewer_email = str(
        payload.get(
            "interviewer_email",
            "",
        )
    ).strip().lower()

    if not interviewer_email:
        raise HTTPException(
            status_code=400,
            detail=(
                "Interviewer email is required"
            ),
        )

    interviewer = (
        db.query(User)
        .filter(
            func.lower(User.email)
            == interviewer_email,
            User.role == "interviewer",
        )
        .first()
    )

    if not interviewer:
        raise HTTPException(
            status_code=404,
            detail="Interviewer not found",
        )

    interview = (
        db.query(Interview)
        .filter(Interview.id == item_id)
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    interview.assigned_interviewer_email = (
        interviewer.email.lower()
    )
    interview.interview_status = "assigned"

    db.commit()
    db.refresh(interview)

    return {
        "message": (
            "Interviewer assigned successfully"
        ),
        "interview_id": interview.id,
        "interviewer_name": (
            interviewer.first_name
        ),
        "assigned_interviewer_email": (
            interview.assigned_interviewer_email
        ),
        "interview_status": (
            interview.interview_status
        ),
    }


@app.get("/interviewer/interviews")
def get_my_interviews(
    db: Session = Depends(get_db),
    user=Depends(
        require_roles("interviewer")
    ),
):
    interviews_list = (
        db.query(Interview)
        .filter(
            func.lower(
                Interview.assigned_interviewer_email
            )
            == user.email.lower()
        )
        .order_by(Interview.id)
        .all()
    )

    return interviews_list


@app.patch(
    "/interviews/{item_id}/submit"
)
def submit_interview(
    item_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(
        require_roles("interviewer")
    ),
):
    interview = (
        db.query(Interview)
        .filter(Interview.id == item_id)
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    assigned_email = (
        interview.assigned_interviewer_email
        or ""
    ).lower()

    current_email = (
        user.email or ""
    ).lower()

    if assigned_email != current_email:
        raise HTTPException(
            status_code=403,
            detail=(
                "This interview is not "
                "assigned to you"
            ),
        )

    try:
        general_score = float(
            payload.get(
                "general_score",
                0,
            )
        )

        technical_score = float(
            payload.get(
                "technical_score",
                0,
            )
        )

        communication_score = float(
            payload.get(
                "communication_score",
                0,
            )
        )

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail=(
                "Scores must be valid numbers"
            ),
        )

    scores = [
        general_score,
        technical_score,
        communication_score,
    ]

    if any(
        score < 0 or score > 5
        for score in scores
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Scores must be between 0 and 5"
            ),
        )

    recommendation = payload.get(
        "recommendation"
    )

    allowed_recommendations = [
        "Accepted",
        "Backup",
        "Rejected",
    ]

    if recommendation not in allowed_recommendations:
        raise HTTPException(
            status_code=400,
            detail=(
                "Recommendation must be "
                "Accepted, Backup, or Rejected"
            ),
        )

    interview.general_score = general_score
    interview.technical_score = technical_score
    interview.communication_score = (
        communication_score
    )
    interview.notes = str(
        payload.get("notes", "")
    ).strip()
    interview.recommendation = recommendation

    interview.total_score = round(
        (
            general_score
            + technical_score
            + communication_score
        )
        / 15
        * 100,
        2,
    )

    interview.interview_status = "completed"

    db.commit()
    db.refresh(interview)

    return {
        "message": (
            "Interview submitted successfully"
        ),
        "id": interview.id,
        "general_score": (
            interview.general_score
        ),
        "technical_score": (
            interview.technical_score
        ),
        "communication_score": (
            interview.communication_score
        ),
        "total_score": interview.total_score,
        "notes": interview.notes,
        "recommendation": (
            interview.recommendation
        ),
        "interview_status": (
            interview.interview_status
        ),
    }


@app.patch("/interviews/{item_id}/decision")
def set_final_interview_decision(
    item_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin")),
):
    interview = (
        db.query(Interview)
        .filter(Interview.id == item_id)
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    if str(interview.interview_status).lower() != "completed":
        raise HTTPException(
            status_code=400,
            detail="The interview must be completed first",
        )

    decision = str(
        payload.get("decision", "")
    ).strip()

    allowed_decisions = [
        "Accepted",
        "Backup",
        "Rejected",
    ]

    if decision not in allowed_decisions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Decision must be Accepted, "
                "Backup, or Rejected"
            ),
        )

    # حفظ قرار الأدمن داخل المقابلة
    interview.decision = decision

    # البحث عن السجل داخل Final Shortlist
    shortlist_item = (
        db.query(FinalShortlist)
        .filter(FinalShortlist.id == item_id)
        .first()
    )

    # إنشاء سجل جديد إذا لم يكن موجودًا
    if not shortlist_item:
        shortlist_item = FinalShortlist(
            id=interview.id,
        )
        db.add(shortlist_item)

    # تحديث بيانات Final Shortlist
    shortlist_item.application_cohort = interview.cohort
    shortlist_item.application_city = interview.city
    shortlist_item.showed_up = interview.showed_up
    shortlist_item.able_to_commit = interview.commitment
    shortlist_item.interview_location = interview.location

    shortlist_item.general_score = interview.general_score
    shortlist_item.general_accept = interview.general_accept

    shortlist_item.technical_score = interview.technical_score
    shortlist_item.technical_accept = interview.technical_accept

    shortlist_item.total_score = interview.total_score
    shortlist_item.decision = decision
    shortlist_item.accepted = decision

    db.commit()
    db.refresh(interview)

    return {
        "message": "Final decision saved successfully",
        "id": interview.id,
        "interviewer_recommendation": interview.recommendation,
        "final_decision": interview.decision,
        "interview_status": interview.interview_status,
    }

# =========================================================
# Final shortlist
# =========================================================


@app.patch("/final-shortlist/{item_id}")
def update_final_shortlist(
    item_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin")),
):
    item = (
        db.query(FinalShortlist)
        .filter(FinalShortlist.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Final shortlist record not found",
        )

    offer_letter = payload.get("offer_letter")
    acceptance_confirmation = payload.get(
        "acceptance_confirmation"
    )

    if offer_letter is not None:
        offer_letter = str(offer_letter).strip()

        allowed_offer_statuses = [
            "Not Sent",
            "Sent",
        ]

        if offer_letter not in allowed_offer_statuses:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Offer letter must be "
                    "Not Sent or Sent"
                ),
            )

        item.offer_letter = offer_letter

    if acceptance_confirmation is not None:
        acceptance_confirmation = str(
            acceptance_confirmation
        ).strip()

        allowed_confirmation_statuses = [
            "Pending",
            "Confirmed",
            "Declined",
        ]

        if (
            acceptance_confirmation
            not in allowed_confirmation_statuses
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Acceptance confirmation must be "
                    "Pending, Confirmed, or Declined"
                ),
            )

        item.acceptance_confirmation = (
            acceptance_confirmation
        )

    db.commit()
    db.refresh(item)

    return {
        "message": "Final shortlist updated successfully",
        "id": item.id,
        "decision": item.decision,
        "offer_letter": item.offer_letter,
        "acceptance_confirmation":
            item.acceptance_confirmation,
    }
@app.get("/final-shortlist")
def get_final_shortlist(
    decision: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin")),
):
    if page < 1:
        page = 1

    if page_size < 1:
        page_size = 20

    query = db.query(FinalShortlist)

    if decision:
        query = query.filter(
            FinalShortlist.decision.ilike(
                decision.strip()
            )
        )

    total = query.count()

    shortlist_rows = (
        query
        .order_by(FinalShortlist.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []

    for shortlist_item in shortlist_rows:
        item_data = {
            column.name: getattr(
                shortlist_item,
                column.name,
                None,
            )
            for column
            in FinalShortlist.__table__.columns
        }

        applicant = (
            db.query(Applicant)
            .filter(
                Applicant.id == shortlist_item.id
            )
            .first()
        )

        item_data["email"] = (
            getattr(applicant, "email", None)
            if applicant
            else None
        )

        items.append(item_data)

    pages = (
        (total + page_size - 1) // page_size
        if total > 0
        else 0
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }
