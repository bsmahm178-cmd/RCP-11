import { useEffect, useMemo, useState } from "react";

import {
  getMyInterviews,
  submitInterview,
} from "../../services/interviews";


function InterviewerDashboard() {
  const [currentInterviews, setCurrentInterviews] =
    useState([]);

  const [forms, setForms] = useState({});
  const [interviewFilter, setInterviewFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] =
    useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  const firstName =
    localStorage.getItem("first_name") ||
    "Interviewer";


  
function isInterviewCompleted(interview) {
  const status = String(
    interview.interview_status ||
      interview.status ||
      ""
  )
    .trim()
    .toLowerCase();

  return (
    status === "completed" ||
    status === "submitted" ||
    status === "evaluated" ||
    interview.is_completed === true ||
    Boolean(interview.submitted_at)
  );
}




  const pendingCount = useMemo(() => {
    return currentInterviews.filter(
      (interview) =>
        !isInterviewCompleted(interview)
    ).length;
  }, [currentInterviews]);


  const completedCount = useMemo(() => {
    return currentInterviews.filter(
      (interview) =>
        isInterviewCompleted(interview)
    ).length;
  }, [currentInterviews]);


  const filteredInterviews = useMemo(() => {
    if (interviewFilter === "pending") {
      return currentInterviews.filter(
        (interview) =>
          !isInterviewCompleted(interview)
      );
    }

    if (interviewFilter === "completed") {
      return currentInterviews.filter(
        (interview) =>
          isInterviewCompleted(interview)
      );
    }

    return currentInterviews;
  }, [currentInterviews, interviewFilter]);


  async function loadInterviews() {
    setLoading(true);
    setError("");

    try {
      const response = await getMyInterviews();

      const items = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];

      setCurrentInterviews(items);

      const initialForms = {};

      items.forEach((interview) => {
        initialForms[interview.id] = {
          general_score:
            interview.general_score ?? 0,

          technical_score:
            interview.technical_score ?? 0,

          communication_score:
            interview.communication_score ?? 0,

          notes:
            interview.notes ?? "",

          recommendation:
            interview.recommendation ||
            "Accepted",
        };
      });

      setForms(initialForms);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to load assigned interviews"
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadInterviews();
  }, []);


  function handleChange(
    interviewId,
    field,
    value
  ) {
    setForms((currentForms) => ({
      ...currentForms,

      [interviewId]: {
        ...currentForms[interviewId],
        [field]: value,
      },
    }));
  }


  async function handleSubmit(
    event,
    interviewId
  ) {
    event.preventDefault();

    setSubmittingId(interviewId);
    setError("");
    setMessage("");

    const form = forms[interviewId];

    try {
      await submitInterview(interviewId, {
        general_score: Number(
          form.general_score
        ),

        technical_score: Number(
          form.technical_score
        ),

        communication_score: Number(
          form.communication_score
        ),

        notes: form.notes,

        recommendation:
          form.recommendation,
      });

      setMessage(
        "Interview submitted successfully"
      );

      await loadInterviews();

      setInterviewFilter("completed");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to submit interview"
      );
    } finally {
      setSubmittingId("");
    }
  }


  function logout() {
    localStorage.clear();
    window.location.href = "/";
  }


  if (loading) {
    return (
      <div className="interviewer-page">
        <p>Loading interviews...</p>
      </div>
    );
  }


  return (
    <div className="interviewer-page">
      <header className="interviewer-header">
        <div>
          <h1>Interviewer Dashboard</h1>
          <p>Welcome, {firstName}</p>
        </div>

        <button
          type="button"
          className="logout-btn"
          onClick={logout}
        >
          Logout
        </button>
      </header>


      <div className="interviewer-filter-bar">
        <div>
          <h2>My Interviews</h2>

          <p>
            Filter interviews by evaluation
            status.
          </p>
        </div>

        <div className="interviewer-filter-buttons">
          <button
            type="button"
            className={
              interviewFilter === "pending"
                ? "active"
                : ""
            }
            onClick={() =>
              setInterviewFilter("pending")
            }
          >
            Pending Evaluation
            <span>{pendingCount}</span>
          </button>

          <button
            type="button"
            className={
              interviewFilter === "completed"
                ? "active"
                : ""
            }
            onClick={() =>
              setInterviewFilter("completed")
            }
          >
            Completed
            <span>{completedCount}</span>
          </button>

          <button
            type="button"
            className={
              interviewFilter === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setInterviewFilter("all")
            }
          >
            All Interviews
            <span>
              {currentInterviews.length}
            </span>
          </button>
        </div>
      </div>


      {message && (
        <div className="success-message">
          {message}
        </div>
      )}


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {currentInterviews.length === 0 ? (
        <div className="empty-card">
          No interviews have been assigned
          to you.
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="empty-card">
          No interviews found in this category.
        </div>
      ) : (
        <div className="interview-list">
          {filteredInterviews.map(
            (interview) => {
              const form =
                forms[interview.id] || {};

              const completed =
                isInterviewCompleted(interview);

              return (
                <form
                  key={interview.id}
                  className="interview-card"
                  onSubmit={(event) =>
                    handleSubmit(
                      event,
                      interview.id
                    )
                  }
                >
                  <div className="interview-card-header">
                    <div>
                      <h2>
                        Interview #
                        {String(
                          interview.id
                        ).slice(0, 10)}
                      </h2>

                      <p>
                        {interview.city ||
                          "No city"}{" "}
                        ·{" "}
                        {interview.cohort ||
                          "No cohort"}
                      </p>
                    </div>

                    <span
                      className={`status-badge ${
                        completed
                          ? "completed"
                          : "pending"
                      }`}
                    >
                      {completed
                        ? "Completed"
                        : "Pending"}
                    </span>
                  </div>


                  <div className="scores-grid">
                    <div>
                      <label>
                        General Score
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.5"
                        value={
                          form.general_score ??
                          0
                        }
                        onChange={(event) =>
                          handleChange(
                            interview.id,
                            "general_score",
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>


                    <div>
                      <label>
                        Technical Score
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.5"
                        value={
                          form.technical_score ??
                          0
                        }
                        onChange={(event) =>
                          handleChange(
                            interview.id,
                            "technical_score",
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>


                    <div>
                      <label>
                        Communication Score
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.5"
                        value={
                          form.communication_score ??
                          0
                        }
                        onChange={(event) =>
                          handleChange(
                            interview.id,
                            "communication_score",
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>
                  </div>


                  <label>Notes</label>

                  <textarea
                    rows="4"
                    placeholder="Write interview notes..."
                    value={form.notes || ""}
                    onChange={(event) =>
                      handleChange(
                        interview.id,
                        "notes",
                        event.target.value
                      )
                    }
                  />


                  <label>Recommendation</label>

                  <select
                    value={
                      form.recommendation ||
                      "Accepted"
                    }
                    onChange={(event) =>
                      handleChange(
                        interview.id,
                        "recommendation",
                        event.target.value
                      )
                    }
                  >
                    <option value="Accepted">
                      Accepted
                    </option>

                    <option value="Backup">
                      Backup
                    </option>

                    <option value="Rejected">
                      Rejected
                    </option>
                  </select>


                  {interview.total_score > 0 && (
                    <p className="total-score">
                      Total Score:{" "}
                      {interview.total_score}%
                    </p>
                  )}


                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={
                      submittingId ===
                      interview.id
                    }
                  >
                    {submittingId ===
                    interview.id
                      ? "Submitting..."
                      : completed
                        ? "Update Evaluation"
                        : "Submit Evaluation"}
                  </button>
                </form>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}


export default InterviewerDashboard;

