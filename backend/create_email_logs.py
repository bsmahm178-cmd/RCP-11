from app.database import Base, engine
from app.email_models import EmailLog  # noqa: F401


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("email_logs table is ready.")
