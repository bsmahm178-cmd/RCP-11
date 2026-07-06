# Admission Workflow Platform

An admission management platform for intensive training programs, built from scratch using:

* **Backend:** FastAPI, Python, SQLite, and JWT
* **Frontend:** React and Vite
* **Database:** SQLite
* **Excel Import:** pandas and openpyxl

## User Roles

### Admin

Has full access to all platform features and permissions.

### Coordinator

Manages applicant records, uploads assessment scores, filters candidates, assigns interviews, and manages admission decisions.

### Interviewer

Has access only to the assigned interviews page to enter interview scores, recommendations, and notes.

## Demo Login Credentials

| Role        | Email                    | Password   |
| ----------- | ------------------------ | ---------- |
| Admin       | `admin@flowin.com`       | `admin123` |
| Coordinator | `coordinator@flowin.com` | `coord123` |
| Interviewer | `interviewer@flowin.com` | `inter123` |

## Running the Backend

Open a terminal inside the `backend` directory:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

## Running the Frontend

Open another terminal inside the `frontend` directory:

```bash
npm install
npm run dev
```

Open the application:

```text
http://127.0.0.1:5173
```

## Excel File Import

After logging in as an Admin or Coordinator, use one of the following options:

* **Import Sample Excel** to import the sample file stored inside the backend.
* **Upload Excel** to upload a new Excel file using the same sheet structure.

## Excel Data Tables

### Applicants

* ID
* Specialization Name
* Education Institution
* Are you a graduate?
* Are you an employee?

### Assessment

* ID
* English Score Percent
* Technical Score
* Test Time Index
* Cheat Score

### Interview

* ID
* Cohort
* City
* Showed Up at Interview
* Commitment
* Interview Confirmed Location
* General Score (5)
* General Acceptance Recommendation
* Technical Score (5)
* Technical Acceptance Recommendation
* Total Score (%100)
* Accepted / Rejected / Backup

### Final Shortlist

* ID
* Application Cohort
* Application City
* Showed Up at Interview
* Turned on Camera
* Graduation
* Able to Commit to Full-Time Bootcamp
* Interview Confirmed Location
* General Score (5)
* General Acceptance Recommendation
* Technical Score (5)
* Technical Acceptance Recommendation
* Total Score (%100)
* Accepted / Rejected / Backup
* Accepted
* Offer Letter
* Acceptance Confirmation

## Important Notes

The current version is a functional MVP that is ready for further development and improvement.

The email feature is currently placed under the Coordinator role. Email operations are simulated and are not connected to a real SMTP service yet. This avoids requiring application passwords or external email credentials during the MVP stage.
