from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .auth import require_roles
from .database import get_db
from .models import User


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "first_name": getattr(user, "first_name", "") or "",
        "last_name": getattr(user, "last_name", "") or "",
        "username": getattr(user, "username", "") or "",
        "email": user.email,
        "role": user.role,
    }


@router.get("")
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin")),
):
    users = (
        db.query(User)
        .order_by(User.role, User.first_name, User.last_name)
        .all()
    )

    return [serialize_user(user) for user in users]


@router.patch("/{user_id}/make-admin")
def make_user_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin")),
):
    target_user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if target_user.role == "admin":
        return {
            "message": "User is already an admin",
            "user": serialize_user(target_user),
        }

    target_user.role = "admin"

    db.commit()
    db.refresh(target_user)

    return {
        "message": "User promoted to admin successfully",
        "user": serialize_user(target_user),
    }
