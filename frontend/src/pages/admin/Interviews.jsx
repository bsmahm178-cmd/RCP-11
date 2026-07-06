
import { useEffect, useMemo, useState } from "react";
import {
  getInterviews,
  setFinalDecision,
} from "../../services/interviews";

const ITEMS_PER_PAGE = 10;

function Interviews() {
  const [allInterviews, setAllInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("awaiting");

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [recommendation, setRecommendation] =
    useState("");

  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadInterviews() {
    setLoading(true);
    setError("");

    try {
      const response = await getInterviews({
        page: 1,
        page_size: 500,
      });

      const items = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];

      const completedItems = items.filter(
        (interview) =>
          String(
            interview.interview_status || ""
          ).toLowerCase() === "completed"
      );

      setAllInterviews(completedItems);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load completed interviews"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInterviews();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [
    activeTab,
    search,
    city,
    recommendation,
  ]);

  const awaitingCount = useMemo(() => {
    return allInterviews.filter(
      (interview) =>
        !String(interview.decision || "").trim()
    ).length;
  }, [allInterviews]);

  const decidedCount = useMemo(() => {
    return allInterviews.filter(
      (interview) =>
        Boolean(
          String(interview.decision || "").trim()
        )
    ).length;
  }, [allInterviews]);

  const filteredInterviews = useMemo(() => {
    return allInterviews.filter((interview) => {
      const hasDecision = Boolean(
        String(interview.decision || "").trim()
      );

      if (
        activeTab === "awaiting" &&
        hasDecision
      ) {
        return false;
      }

      if (
        activeTab === "decided" &&
        !hasDecision
      ) {
        return false;
      }

      if (
        search &&
        !String(interview.id)
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }

      if (
        city &&
        !String(interview.city || "")
          .toLowerCase()
          .includes(city.toLowerCase())
      ) {
        return false;
      }

      if (
        recommendation &&
        interview.recommendation !== recommendation
      ) {
        return false;
      }

      return true;
    });
  }, [
    allInterviews,
    activeTab,
    search,
    city,
    recommendation,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredInterviews.length / ITEMS_PER_PAGE
    )
  );

  const visibleInterviews = useMemo(() => {
    const start =
      (page - 1) * ITEMS_PER_PAGE;

    return filteredInterviews.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [filteredInterviews, page]);

  function openReview(interview) {
    setSelectedInterview(interview);
    setDecision(interview.decision || "");
    setError("");
    setMessage("");
  }

  function closeReview() {
    setSelectedInterview(null);
    setDecision("");
  }

  async function saveDecision() {
    if (!selectedInterview) {
      return;
    }

    if (!decision) {
      setError("Please select a final decision");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await setFinalDecision(
        selectedInterview.id,
        decision
      );

      closeReview();

      setMessage(
        "Final decision saved and added to Final Shortlist"
      );

      await loadInterviews();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to save final decision"
      );
    } finally {
      setSaving(false);
    }
  }

  function badgeClass(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  return (
    <div className="compact-interviews-page">
      <header className="compact-interviews-header">
        <div>
          <span>Admission Review</span>

          <h1>Completed Interviews</h1>

          <p>
            Review evaluations and make the final
            admission decision.
          </p>
        </div>

        <div className="compact-interviews-count">
          {filteredInterviews.length} interviews
        </div>
      </header>

      <div className="compact-interview-tabs">
        <button
          type="button"
          className={
            activeTab === "awaiting"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("awaiting")
          }
        >
          Awaiting Decision
          <span>{awaitingCount}</span>
        </button>

        <button
          type="button"
          className={
            activeTab === "decided"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("decided")
          }
        >
          Decided
          <span>{decidedCount}</span>
        </button>
      </div>

      <div className="compact-interview-filters">
        <input
          type="search"
          placeholder="Search applicant ID..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <input
          type="text"
          placeholder="Filter by city..."
          value={city}
          onChange={(event) =>
            setCity(event.target.value)
          }
        />

        <select
          value={recommendation}
          onChange={(event) =>
            setRecommendation(
              event.target.value
            )
          }
        >
          <option value="">
            All recommendations
          </option>

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
      </div>

      {message && (
        <div className="compact-interview-success">
          {message}
        </div>
      )}

      {error && (
        <div className="compact-interview-error">
          {error}
        </div>
      )}

      <section className="compact-interview-table-card">
        {loading ? (
          <div className="compact-interview-empty">
            Loading interviews...
          </div>
        ) : visibleInterviews.length === 0 ? (
          <div className="compact-interview-empty">
            No interviews found.
          </div>
        ) : (
          <div className="compact-interview-table-wrapper">
            <table className="compact-interview-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>City</th>
                  <th>Total</th>
                  <th>Recommendation</th>
                  <th>Final Decision</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleInterviews.map(
                  (interview) => (
                    <tr key={interview.id}>
                      <td>
                        <strong
                          title={interview.id}
                        >
                          {String(
                            interview.id
                          ).slice(0, 12)}
                          ...
                        </strong>

                        <small>
                          {interview.cohort || "-"}
                        </small>
                      </td>

                      <td>
                        {interview.city || "-"}
                      </td>

                      <td>
                        <b className="compact-total-value">
                          {interview.total_score ??
                            0}
                          %
                        </b>
                      </td>

                      <td>
                        <span
                          className={`compact-result-badge ${badgeClass(
                            interview.recommendation
                          )}`}
                        >
                          {interview.recommendation ||
                            "Not set"}
                        </span>
                      </td>

                      <td>
                        {interview.decision ? (
                          <span
                            className={`compact-result-badge ${badgeClass(
                              interview.decision
                            )}`}
                          >
                            {interview.decision}
                          </span>
                        ) : (
                          <span className="compact-awaiting-text">
                            Awaiting admin
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="compact-open-review"
                          onClick={() =>
                            openReview(interview)
                          }
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="compact-interview-pagination">
        <span>
          Page {page} of {totalPages}
        </span>

        <div>
          <button
            type="button"
            disabled={page === 1}
            onClick={() =>
              setPage((current) =>
                Math.max(1, current - 1)
              )
            }
          >
            Previous
          </button>

          <button
            type="button"
            disabled={page === totalPages}
            onClick={() =>
              setPage((current) =>
                Math.min(
                  totalPages,
                  current + 1
                )
              )
            }
          >
            Next
          </button>
        </div>
      </footer>

      {selectedInterview && (
        <div
          className="compact-review-backdrop"
          onMouseDown={closeReview}
        >
          <div
            className="compact-review-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="compact-review-modal-header">
              <div>
                <span>Applicant Review</span>

                <h2>
                  {String(
                    selectedInterview.id
                  ).slice(0, 18)}
                  ...
                </h2>

                <p>
                  {selectedInterview.city ||
                    "-"}{" "}
                  ·{" "}
                  {selectedInterview.cohort ||
                    "-"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReview}
              >
                ×
              </button>
            </header>

            <div className="compact-review-scores">
              <div>
                <span>General</span>
                <strong>
                  {selectedInterview.general_score ??
                    0}
                  /5
                </strong>
              </div>

              <div>
                <span>Technical</span>
                <strong>
                  {selectedInterview.technical_score ??
                    0}
                  /5
                </strong>
              </div>

              <div>
                <span>Communication</span>
                <strong>
                  {selectedInterview.communication_score ??
                    0}
                  /5
                </strong>
              </div>

              <div className="total">
                <span>Total</span>
                <strong>
                  {selectedInterview.total_score ??
                    0}
                  %
                </strong>
              </div>
            </div>

            <section className="compact-review-section">
              <label>Interviewer Notes</label>

              <p>
                {selectedInterview.notes ||
                  "No notes were provided."}
              </p>
            </section>

            <section className="compact-review-section">
              <label>
                Interviewer Recommendation
              </label>

              <span
                className={`compact-result-badge ${badgeClass(
                  selectedInterview.recommendation
                )}`}
              >
                {selectedInterview.recommendation ||
                  "Not set"}
              </span>
            </section>

            <footer className="compact-review-decision">
              <label>Final Decision</label>

              <select
                value={decision}
                onChange={(event) =>
                  setDecision(event.target.value)
                }
              >
                <option value="">
                  Select final decision
                </option>

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

              <button
                type="button"
                disabled={saving}
                onClick={saveDecision}
              >
                {saving
                  ? "Saving..."
                  : "Save Decision"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default Interviews;
