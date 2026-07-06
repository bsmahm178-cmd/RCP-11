import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  RefreshCw,
  Search,
  UserCheck,
} from "lucide-react";

import api from "../../services/api";

function getItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
}

function CoordinatorInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [interviewers, setInterviewers] = useState([]);

  const [selectedInterviewers, setSelectedInterviewers] =
    useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPage() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const results = await Promise.allSettled([
        api.get("/interviews"),
        api.get("/users/interviewers"),
      ]);

      const interviewsResult = results[0];
      const interviewersResult = results[1];

      if (interviewsResult.status === "fulfilled") {
        setInterviews(
          getItems(interviewsResult.value?.data)
        );
      } else {
        setInterviews([]);

        throw interviewsResult.reason;
      }

      if (interviewersResult.status === "fulfilled") {
        setInterviewers(
          getItems(interviewersResult.value?.data)
        );
      } else {
        setInterviewers([]);

        setError(
          getErrorMessage(
            interviewersResult.reason,
            "Interviews loaded, but interviewers could not be loaded."
          )
        );
      }
    } catch (requestError) {
      console.error(
        "Coordinator interviews loading error:",
        requestError
      );

      setError(
        getErrorMessage(
          requestError,
          "Failed to load interviews."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  const filteredInterviews = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return interviews.filter((interview) => {
      const id = String(interview?.id || "")
        .toLowerCase();

      const city = String(interview?.city || "")
        .toLowerCase();

      const cohort = String(interview?.cohort || "")
        .toLowerCase();

      const assignedEmail = String(
        interview?.assigned_interviewer_email || ""
      ).toLowerCase();

      const interviewStatus = String(
        interview?.interview_status || "pending"
      ).toLowerCase();

      const matchesSearch =
        !keyword ||
        id.includes(keyword) ||
        city.includes(keyword) ||
        cohort.includes(keyword) ||
        assignedEmail.includes(keyword);

      const isAssigned = Boolean(
        interview?.assigned_interviewer_email
      );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "assigned" && isAssigned) ||
        (statusFilter === "unassigned" && !isAssigned) ||
        interviewStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [interviews, search, statusFilter]);

  function handleSelectedInterviewer(
    interviewId,
    email
  ) {
    setSelectedInterviewers((current) => ({
      ...current,
      [interviewId]: email,
    }));
  }

  async function assignInterviewer(interviewId) {
    const interviewerEmail =
      selectedInterviewers[interviewId];

    if (!interviewerEmail) {
      setError(
        "Select an interviewer before assigning."
      );
      return;
    }

    setAssigningId(interviewId);
    setError("");
    setMessage("");

    try {
      const response = await api.patch(
        `/interviews/${encodeURIComponent(
          interviewId
        )}/assign`,
        {
          interviewer_email: interviewerEmail,
        }
      );

      const responseData = response?.data || {};

      setInterviews((currentInterviews) =>
        currentInterviews.map((interview) =>
          String(interview.id) ===
          String(interviewId)
            ? {
                ...interview,
                assigned_interviewer_email:
                  responseData.assigned_interviewer_email ||
                  interviewerEmail,
                interview_status:
                  responseData.interview_status ||
                  "assigned",
              }
            : interview
        )
      );

      setMessage(
        `Interviewer assigned successfully to ${interviewId}.`
      );
    } catch (assignError) {
      console.error(
        "Assign interviewer error:",
        assignError
      );

      setError(
        getErrorMessage(
          assignError,
          "Failed to assign interviewer."
        )
      );
    } finally {
      setAssigningId("");
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div className="table-card">
          <p className="empty-state">
            Loading interviews...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page coordinator-interviews-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            INTERVIEW COORDINATION
          </p>

          <h1>Interviews</h1>

          <p>
            
            
          </p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={loadPage}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {message && (
        <div className="notice">
          {message}
        </div>
      )}

      <div className="filters-card">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by applicant ID, city, cohort, or interviewer..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">
            All Interviews
          </option>

          <option value="unassigned">
            Unassigned
          </option>

          <option value="assigned">
            Assigned
          </option>

          <option value="completed">
            Completed
          </option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>
              Interviews ({filteredInterviews.length})
            </h3>

            <span>
              Available interviewers:{" "}
              {interviewers.length}
            </span>
          </div>
        </div>

        {filteredInterviews.length === 0 ? (
          <div className="empty-state">
            <CalendarCheck size={34} />

            <p>
              No interviews were found.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant ID</th>
                  <th>Cohort</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Assigned Interviewer</th>
                  <th>Select Interviewer</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredInterviews.map(
                  (interview) => {
                    const interviewId = String(
                      interview?.id || ""
                    );

                    const assignedEmail =
                      interview
                        ?.assigned_interviewer_email ||
                      "";

                    const selectedEmail =
                      selectedInterviewers[
                        interviewId
                      ] ||
                      assignedEmail ||
                      "";

                    return (
                      <tr key={interviewId}>
                        <td title={interviewId}>
                          {interviewId.length > 14
                            ? `${interviewId.slice(
                                0,
                                14
                              )}...`
                            : interviewId}
                        </td>

                        <td>
                          {interview?.cohort || "-"}
                        </td>

                        <td>
                          {interview?.city || "-"}
                        </td>

                        <td>
                          <span
                            className={`status-chip ${
                              assignedEmail
                                ? "yes-chip"
                                : "no-chip"
                            }`}
                          >
                            {interview
                              ?.interview_status ||
                              (assignedEmail
                                ? "Assigned"
                                : "Pending")}
                          </span>
                        </td>

                        <td>
                          {assignedEmail || "Unassigned"}
                        </td>

                        <td>
                          <select
                            value={selectedEmail}
                            onChange={(event) =>
                              handleSelectedInterviewer(
                                interviewId,
                                event.target.value
                              )
                            }
                          >
                            <option value="">
                              Select interviewer
                            </option>

                            {interviewers.map(
                              (interviewer) => (
                                <option
                                  key={
                                    interviewer.email
                                  }
                                  value={
                                    interviewer.email
                                  }
                                >
                                  {interviewer.first_name}{" "}
                                  ({interviewer.email})
                                </option>
                              )
                            )}
                          </select>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="primary-btn assign-interviewer-btn"
                            disabled={
                              !selectedEmail ||
                              assigningId ===
                                interviewId
                            }
                            onClick={() =>
                              assignInterviewer(
                                interviewId
                              )
                            }
                          >
                            <UserCheck size={16} />

                            {assigningId ===
                            interviewId
                              ? "Assigning..."
                              : "Assign"}
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default CoordinatorInterviews;
