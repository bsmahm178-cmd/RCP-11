import re

import pandas as pd
from sqlalchemy.orm import Session

from .models import Applicant, Assessment, Interview, FinalShortlist


def normalize_name(value):
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def clean(value):
    if pd.isna(value):
        return None

    text = str(value).strip()

    if not text or text.lower() in {"nan", "none", "null"}:
        return None

    return text


def optional_bool(value):
    text = clean(value)

    if text is None:
        return None

    normalized = text.lower()

    if normalized in {"yes", "true", "1", "y"}:
        return True

    if normalized in {"no", "false", "0", "n"}:
        return False

    return None


def optional_number(value):
    text = clean(value)

    if text is None:
        return None

    try:
        return float(text.replace("%", "").replace(",", ""))
    except (TypeError, ValueError):
        return None


def column_map(dataframe):
    return {
        normalize_name(column): column
        for column in dataframe.columns
    }


def row_value(row, columns, *names):
    for name in names:
        original_column = columns.get(normalize_name(name))

        if original_column is not None:
            return row.get(original_column)

    return None


def find_sheet(sheets, *names):
    normalized_sheets = {
        normalize_name(sheet_name): dataframe
        for sheet_name, dataframe in sheets.items()
    }

    for name in names:
        dataframe = normalized_sheets.get(normalize_name(name))

        if dataframe is not None:
            return dataframe

    return None


def update_or_create(db, model, record_id, values):
    record = db.query(model).filter(model.id == record_id).first()

    if record is None:
        record = model(id=record_id)
        db.add(record)

    # Blank Excel cells do not erase existing database values.
    # A later upload with a real value fills or updates the field.
    for field_name, value in values.items():
        if value is not None and hasattr(record, field_name):
            setattr(record, field_name, value)

    return record


def valid_rows(dataframe, columns):
    id_column = columns.get(normalize_name("ID"))

    if id_column is None:
        raise ValueError(
            f'Sheet "{dataframe.attrs.get("sheet_name", "unknown")}" '
            'must contain an "ID" column.'
        )

    return dataframe.dropna(subset=[id_column])


def import_workbook(path: str, db: Session):
    sheets = pd.read_excel(path, sheet_name=None)
    counts = {}

    try:
        applicants = find_sheet(sheets, "Applicants", "Applicant")

        if applicants is not None:
            applicants.attrs["sheet_name"] = "Applicants"
            columns = column_map(applicants)
            dataframe = valid_rows(applicants, columns)

            for _, row in dataframe.iterrows():
                record_id = clean(row_value(row, columns, "ID"))

                if record_id is None:
                    continue

                update_or_create(
                    db,
                    Applicant,
                    record_id,
                    {
                        "specialization_name": clean(
                            row_value(
                                row,
                                columns,
                                "Specialization Name",
                                "Specialization",
                            )
                        ),
                        "education_institution": clean(
                            row_value(
                                row,
                                columns,
                                "Education Institution",
                                "University",
                            )
                        ),
                        "is_graduate": optional_bool(
                            row_value(
                                row,
                                columns,
                                "Are you a graduate?",
                                "Graduate?",
                            )
                        ),
                        "is_employee": optional_bool(
                            row_value(
                                row,
                                columns,
                                "Are you an employee?",
                                "Employee?",
                            )
                        ),
                        "email": clean(
                            row_value(
                                row,
                                columns,
                                "Email",
                                "Applicant Email",
                                "Email Address",
                            )
                        ),
                    },
                )

            counts["applicants"] = len(dataframe)

        assessments = find_sheet(
            sheets,
            "Assessment",
            "Assessments",
        )

        if assessments is not None:
            assessments.attrs["sheet_name"] = "Assessment"
            columns = column_map(assessments)
            dataframe = valid_rows(assessments, columns)

            for _, row in dataframe.iterrows():
                record_id = clean(row_value(row, columns, "ID"))

                if record_id is None:
                    continue

                update_or_create(
                    db,
                    Assessment,
                    record_id,
                    {
                        "english_score_percent": optional_number(
                            row_value(
                                row,
                                columns,
                                "English Score Percent",
                                "English",
                            )
                        ),
                        "technical_score": optional_number(
                            row_value(
                                row,
                                columns,
                                "Technical Score",
                                "Technical",
                            )
                        ),
                        "test_time_index": optional_number(
                            row_value(
                                row,
                                columns,
                                "Test Time Index",
                                "Test Time",
                            )
                        ),
                        "cheat_score": optional_number(
                            row_value(
                                row,
                                columns,
                                "Cheat Score",
                                "Cheat",
                            )
                        ),
                    },
                )

            counts["assessments"] = len(dataframe)

        interviews = find_sheet(
            sheets,
            "Interview",
            "Interviews",
        )

        if interviews is not None:
            interviews.attrs["sheet_name"] = "Interview"
            columns = column_map(interviews)
            dataframe = valid_rows(interviews, columns)

            for _, row in dataframe.iterrows():
                record_id = clean(row_value(row, columns, "ID"))

                if record_id is None:
                    continue

                update_or_create(
                    db,
                    Interview,
                    record_id,
                    {
                        "cohort": clean(
                            row_value(
                                row,
                                columns,
                                "cohort",
                                "Application Cohort",
                            )
                        ),
                        "city": clean(
                            row_value(
                                row,
                                columns,
                                "City",
                                "Application City",
                            )
                        ),
                        "showed_up": optional_bool(
                            row_value(
                                row,
                                columns,
                                "Showed Up at Interview",
                                "Showed Up",
                            )
                        ),
                        "commitment": clean(
                            row_value(row, columns, "Commitment")
                        ),
                        "location": clean(
                            row_value(
                                row,
                                columns,
                                "Interview Confirmed Location",
                                "Location",
                            )
                        ),
                        "general_score": optional_number(
                            row_value(
                                row,
                                columns,
                                "General Score (5)",
                                "General Score",
                            )
                        ),
                        "general_accept": clean(
                            row_value(
                                row,
                                columns,
                                "General Accept",
                                "Accept",
                            )
                        ),
                        "technical_score": optional_number(
                            row_value(
                                row,
                                columns,
                                "Technical Score (5)",
                                "Technical Score",
                            )
                        ),
                        "technical_accept": clean(
                            row_value(
                                row,
                                columns,
                                "Technical Accept",
                            )
                        ),
                        "total_score": optional_number(
                            row_value(
                                row,
                                columns,
                                "Total (%100)",
                                "Total",
                            )
                        ),
                        "decision": clean(
                            row_value(
                                row,
                                columns,
                                "Accepted / Rejected / backup",
                                "Accepted / Rejected  / backup",
                                "Decision",
                            )
                        ),
                    },
                )

            counts["interviews"] = len(dataframe)

        final_shortlist = find_sheet(
            sheets,
            "Final Shotlist",
            "Final Shortlist",
            "Final shortlist",
        )

        if final_shortlist is not None:
            final_shortlist.attrs["sheet_name"] = "Final Shortlist"
            columns = column_map(final_shortlist)
            dataframe = valid_rows(final_shortlist, columns)

            for _, row in dataframe.iterrows():
                record_id = clean(row_value(row, columns, "ID"))

                if record_id is None:
                    continue

                update_or_create(
                    db,
                    FinalShortlist,
                    record_id,
                    {
                        "application_cohort": clean(
                            row_value(
                                row,
                                columns,
                                "Application (cohort)",
                                "Application Cohort",
                                "cohort",
                            )
                        ),
                        "application_city": clean(
                            row_value(
                                row,
                                columns,
                                "Application (City)",
                                "Application City",
                                "City",
                            )
                        ),
                        "showed_up": optional_bool(
                            row_value(
                                row,
                                columns,
                                "Showed Up at Interview",
                                "Showed Up",
                            )
                        ),
                        "turned_on_camera": optional_bool(
                            row_value(
                                row,
                                columns,
                                "Turned on Camera",
                            )
                        ),
                        "graduation": clean(
                            row_value(row, columns, "Graduation")
                        ),
                        "able_to_commit": clean(
                            row_value(
                                row,
                                columns,
                                "Able to Commit to Full-time Bootcamp",
                                "Able to Commit",
                            )
                        ),
                        "interview_location": clean(
                            row_value(
                                row,
                                columns,
                                "Interview Confirmed Location",
                                "Interview Location",
                            )
                        ),
                        "general_score": optional_number(
                            row_value(
                                row,
                                columns,
                                "General Score (5)",
                                "General Score",
                            )
                        ),
                        "general_accept": clean(
                            row_value(
                                row,
                                columns,
                                "General Accept",
                                "Accept",
                            )
                        ),
                        "technical_score": optional_number(
                            row_value(
                                row,
                                columns,
                                "Technical Score (5)",
                                "Technical Score",
                            )
                        ),
                        "technical_accept": clean(
                            row_value(
                                row,
                                columns,
                                "Technical Accept",
                            )
                        ),
                        "total_score": optional_number(
                            row_value(
                                row,
                                columns,
                                "Total (%100)",
                                "Total",
                            )
                        ),
                        "decision": clean(
                            row_value(
                                row,
                                columns,
                                "Accepted / Rejected / backup",
                                "Accepted / Rejected  / backup",
                                "Decision",
                            )
                        ),
                        "accepted": clean(
                            row_value(row, columns, "Accepted")
                        ),
                        "offer_letter": clean(
                            row_value(row, columns, "Offer Letter")
                        ),
                        "acceptance_confirmation": clean(
                            row_value(
                                row,
                                columns,
                                "Acceptance Confirmation",
                                "Confirmation",
                            )
                        ),
                    },
                )

            counts["final_shortlist"] = len(dataframe)

        db.commit()
        return counts

    except Exception:
        db.rollback()
        raise
