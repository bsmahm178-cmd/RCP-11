from sqlalchemy import text

from app.database import engine


def add_email_column() -> None:
    with engine.begin() as connection:
        columns = connection.execute(
            text("PRAGMA table_info(applicants)")
        ).fetchall()

        column_names = [
            column[1]
            for column in columns
        ]

        if "email" in column_names:
            print(
                "The email column already exists."
            )
            return

        connection.execute(
            text(
                "ALTER TABLE applicants "
                "ADD COLUMN email VARCHAR"
            )
        )

        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS "
                "ix_applicants_email "
                "ON applicants (email)"
            )
        )

        print(
            "The email column was added successfully."
        )


if __name__ == "__main__":
    add_email_column()
