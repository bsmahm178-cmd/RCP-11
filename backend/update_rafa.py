import sqlite3

OLD_EMAIL = "sara@flowin.com"
NEW_EMAIL = "rafa@flowin.com"
OLD_USERNAME = "sara"
NEW_USERNAME = "rafa"

db = sqlite3.connect("admission.db")
cursor = db.cursor()

old_user = cursor.execute(
    """
    SELECT id
    FROM users
    WHERE email = ? OR username = ?
    """,
    (OLD_EMAIL, OLD_USERNAME),
).fetchone()

new_user = cursor.execute(
    """
    SELECT id
    FROM users
    WHERE email = ? OR username = ?
    """,
    (NEW_EMAIL, NEW_USERNAME),
).fetchone()

if new_user:
    new_user_id = new_user[0]

    cursor.execute(
        """
        UPDATE users
        SET first_name = ?, username = ?, email = ?
        WHERE id = ?
        """,
        ("Rafa", NEW_USERNAME, NEW_EMAIL, new_user_id),
    )

    if old_user and old_user[0] != new_user_id:
        cursor.execute(
            "DELETE FROM users WHERE id = ?",
            (old_user[0],),
        )

elif old_user:
    cursor.execute(
        """
        UPDATE users
        SET first_name = ?, username = ?, email = ?
        WHERE id = ?
        """,
        ("Rafa", NEW_USERNAME, NEW_EMAIL, old_user[0]),
    )

else:
    print("Rafa user was not found.")

cursor.execute(
    """
    UPDATE interviews
    SET assigned_interviewer_email = ?
    WHERE assigned_interviewer_email = ?
    """,
    (NEW_EMAIL, OLD_EMAIL),
)

db.commit()

result = cursor.execute(
    """
    SELECT id, first_name, username, email, role
    FROM users
    WHERE email = ?
    """,
    (NEW_EMAIL,),
).fetchall()

print("Updated user:", result)

db.close()