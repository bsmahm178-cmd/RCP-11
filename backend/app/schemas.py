from pydantic import BaseModel


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: str
    password: str
    role: str = "interviewer"


class UserResponse(BaseModel):
    id: int
    first_name: str | None = None
    last_name: str | None = None
    username: str
    email: str
    role: str

    model_config = {
        "from_attributes": True
    }