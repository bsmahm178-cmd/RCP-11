import { useEffect, useMemo, useState } from "react";
import {
  getFinalShortlist,
  updateFinalShortlist,
} from "../../services/finalShortlist";
import "./FinalShortlist.css";

const ITEMS_PER_PAGE = 10;

const OFFER_OPTIONS = ["Not Sent", "Sent"];

const CONFIRMATION_OPTIONS = [
  "Pending",
  "Confirmed",
  "Declined",
];


const EMAIL_STORAGE_KEY = "flowin_simulated_email_history";

const DECISION_EMAIL_TEMPLATES = {
  accepted: {
    label: "Acceptance",
    subject: "FLOWIN Admission Decision - Accepted",
    body: `Dear Applicant,\n\nCongratulations! We are pleased to inform you that you have been accepted into the program.\n\nFurther details will be shared with you soon.\n\nBest regards,\nFLOWIN Admissions Team`,
  },
  backup: {
    label: "Waiting List",
    subject: "FLOWIN Admission Decision - Waiting List",
    body: `Dear Applicant,\n\nThank you for your interest in the program. Your application has been placed on the waiting list.\n\nWe will contact you if a place becomes available.\n\nBest regards,\nFLOWIN Admissions Team`,
  },
  rejected: {
    label: "Rejection",
    subject: "FLOWIN Admission Decision",
    body: `Dear Applicant,\n\nThank you for your interest in the program. After careful review, we are unable to offer you a place at this time.\n\nWe appreciate the time and effort you invested in the process.\n\nBest regards,\nFLOWIN Admissions Team`,
  },
};

function readSimulatedEmailHistory() {
  try {
    const history = JSON.parse(
      localStorage.getItem(EMAIL_STORAGE_KEY) || "[]"
    );

    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

function buildSimulatedDecisionEmail(item, index = 0) {
  const decision = String(item.decision || "").trim().toLowerCase();
  const template = DECISION_EMAIL_TEMPLATES[decision];

  if (!template) {
    return null;
  }

  const shortId = String(item.id || "applicant").slice(0, 8);
  const recipientEmail =
    item.email || `applicant-${shortId}@flowin.demo`;
  const sentAt = new Date().toISOString();

  return {
    id: `${Date.now()}-${index}-${item.id}`,
    recipient_email: recipientEmail,
    email_type: decision,
    applicant_id: item.id,
    subject: template.subject,
    body: template.body,
    status: "Simulated",
    sent_by:
      localStorage.getItem("first_name") ||
      localStorage.getItem("name") ||
      "Admin",
    sent_at: sentAt,
    label: template.label,
  };
}

function saveSimulatedDecisionEmails(candidateItems) {
  const records = candidateItems
    .map((item, index) => buildSimulatedDecisionEmail(item, index))
    .filter(Boolean);

  if (records.length === 0) {
    return [];
  }

  const history = readSimulatedEmailHistory();

  localStorage.setItem(
    EMAIL_STORAGE_KEY,
    JSON.stringify([...records, ...history])
  );

  return records;
}

function saveSimulatedDecisionEmail(item) {
  const [record] = saveSimulatedDecisionEmails([item]);
  return record || null;
}

const bulkSecondaryButtonStyle = {
  padding: "10px 14px",
  border: "1px solid #d9d1e7",
  borderRadius: "10px",
  background: "#faf8ff",
  color: "#4c1d95",
  fontWeight: 800,
  cursor: "pointer",
};

function FinalShortlist() {
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkSending, setBulkSending] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const response = await getFinalShortlist();

      const result = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
          ? response.data.items
          : [];

      setItems(result);

      const initialDrafts = {};

      result.forEach((item) => {
        initialDrafts[item.id] = {
          offer_letter: item.offer_letter || "Not Sent",
          acceptance_confirmation:
            item.acceptance_confirmation || "Pending",
        };
      });

      setDrafts(initialDrafts);
    } catch (err) {
      console.error("Final Shortlist error:", err);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load final shortlist"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, city, decisionFilter]);

  const statistics = useMemo(() => {
    const accepted = items.filter(
      (item) =>
        String(item.decision || "").toLowerCase() === "accepted"
    ).length;

    const backup = items.filter(
      (item) =>
        String(item.decision || "").toLowerCase() === "backup"
    ).length;

    const rejected = items.filter(
      (item) =>
        String(item.decision || "").toLowerCase() === "rejected"
    ).length;

    return {
      total: items.length,
      accepted,
      backup,
      rejected,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const itemId = String(item.id || "").toLowerCase();
      const itemCity = String(item.application_city || "").toLowerCase();
      const itemDecision = String(item.decision || "").toLowerCase();

      if (search && !itemId.includes(search.toLowerCase())) {
        return false;
      }

      if (city && !itemCity.includes(city.toLowerCase())) {
        return false;
      }

      if (
        decisionFilter &&
        itemDecision !== decisionFilter.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [items, search, city, decisionFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  );

  const visibleItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;

    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, page]);

  const selectedItems = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return items.filter((item) => selectedSet.has(item.id));
  }, [items, selectedIds]);

  const allVisibleSelected =
    visibleItems.length > 0 &&
    visibleItems.every((item) => selectedIds.includes(item.id));

  function toggleSelection(itemId) {
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  }

  function toggleVisibleSelection() {
    const visibleIds = visibleItems.map((item) => item.id);

    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  function selectByDecision(decision) {
    const matchingIds = items
      .filter(
        (item) =>
          String(item.decision || "").trim().toLowerCase() === decision
      )
      .map((item) => item.id);

    setSelectedIds(matchingIds);
    setMessage(
      matchingIds.length > 0
        ? `${matchingIds.length} candidates selected.`
        : "No candidates found for this decision."
    );
    setError("");
  }

  function clearSelection() {
    setSelectedIds([]);
    setMessage("");
    setError("");
  }

  function handleBulkEmail() {
    setMessage("");
    setError("");

    if (selectedItems.length === 0) {
      setError("Select at least one candidate first.");
      return;
    }

    setBulkSending(true);

    try {
      const records = saveSimulatedDecisionEmails(selectedItems);

      if (records.length === 0) {
        setError(
          "The selected candidates do not have a valid admission decision."
        );
        return;
      }

      const acceptedCount = records.filter(
        (record) => record.email_type === "accepted"
      ).length;
      const waitingCount = records.filter(
        (record) => record.email_type === "backup"
      ).length;
      const rejectedCount = records.filter(
        (record) => record.email_type === "rejected"
      ).length;

      const summary = [
        acceptedCount ? `${acceptedCount} accepted` : "",
        waitingCount ? `${waitingCount} waiting list` : "",
        rejectedCount ? `${rejectedCount} rejected` : "",
      ]
        .filter(Boolean)
        .join(", ");

      setMessage(
        `${records.length} simulated emails sent successfully (${summary}). Check Emails > Email History.`
      );
      setSelectedIds([]);
    } finally {
      setBulkSending(false);
    }
  }

  function updateDraft(itemId, field, value) {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        ...current[itemId],
        [field]: value,
      },
    }));
  }

  async function handleSave(itemId) {
    const draft = drafts[itemId];
    const originalItem = items.find((item) => item.id === itemId);

    if (!draft || !originalItem) {
      return;
    }

    const payload = {};

    if (draft.offer_letter !== originalItem.offer_letter) {
      payload.offer_letter = draft.offer_letter;
    }

    if (
      draft.acceptance_confirmation !==
      originalItem.acceptance_confirmation
    ) {
      payload.acceptance_confirmation =
        draft.acceptance_confirmation;
    }

    setSavingId(itemId);
    setMessage("");
    setError("");

    try {
      if (Object.keys(payload).length > 0) {
        await updateFinalShortlist(itemId, payload);
      }

      const simulatedEmail = saveSimulatedDecisionEmail(originalItem);

      if (!simulatedEmail) {
        setMessage(
          Object.keys(payload).length > 0
            ? "Final shortlist updated successfully"
            : "No changes to save"
        );
      } else {
        setMessage(
          `${simulatedEmail.label} email simulated successfully for ${simulatedEmail.recipient_email}. Check Emails > Email History.`
        );
      }

      if (Object.keys(payload).length > 0) {
        await loadData();
      }
    } catch (err) {
      console.error("Final Shortlist update error:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to update final shortlist"
      );
    } finally {
      setSavingId("");
    }
  }

  function badgeClass(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replaceAll(" ", "-");
  }

  function getAvailableOptions(currentValue, options) {
    if (!currentValue || options.includes(currentValue)) {
      return options;
    }

    return [currentValue, ...options];
  }

  return (
    <div className="shortlist-page">
     

      <section className="shortlist-stats">
        <div>
          <span>Total Candidates</span>
          <strong>{statistics.total}</strong>
        </div>

        <div className="accepted">
          <span>Accepted</span>
          <strong>{statistics.accepted}</strong>
        </div>

        <div className="backup">
          <span>Backup</span>
          <strong>{statistics.backup}</strong>
        </div>

        <div className="rejected">
          <span>Rejected</span>
          <strong>{statistics.rejected}</strong>
        </div>
      </section>

      <section className="shortlist-filters">
        <input
          type="search"
          placeholder="Search applicant ID..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <input
          type="text"
          placeholder="Filter by city..."
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />

        <select
          value={decisionFilter}
          onChange={(event) => setDecisionFilter(event.target.value)}
        >
          <option value="">All decisions</option>
          <option value="Accepted">Accepted</option>
          <option value="Backup">Backup</option>
          <option value="Rejected">Rejected</option>
        </select>
      </section>

      <section
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          margin: "18px 0",
          padding: "16px",
          border: "1px solid #e5def0",
          borderRadius: "14px",
          background: "#ffffff",
          boxShadow: "0 8px 24px rgba(45, 27, 105, 0.06)",
        }}
      >
        <strong style={{ color: "#2d1b69", marginRight: "6px" }}>
          Bulk Email
        </strong>

        <button
          type="button"
          onClick={() => selectByDecision("accepted")}
          style={bulkSecondaryButtonStyle}
        >
          Select Accepted ({statistics.accepted})
        </button>

        <button
          type="button"
          onClick={() => selectByDecision("backup")}
          style={bulkSecondaryButtonStyle}
        >
          Select Waiting List ({statistics.backup})
        </button>

        <button
          type="button"
          onClick={() => selectByDecision("rejected")}
          style={bulkSecondaryButtonStyle}
        >
          Select Rejected ({statistics.rejected})
        </button>

        <button
          type="button"
          onClick={clearSelection}
          disabled={selectedIds.length === 0}
          style={{
            ...bulkSecondaryButtonStyle,
            opacity: selectedIds.length === 0 ? 0.5 : 1,
          }}
        >
          Clear
        </button>

        <span
          style={{
            marginLeft: "auto",
            color: "#625775",
            fontWeight: 700,
          }}
        >
          {selectedIds.length} selected
        </span>

        <button
          type="button"
          onClick={handleBulkEmail}
          disabled={selectedIds.length === 0 || bulkSending}
          style={{
            padding: "11px 18px",
            border: "none",
            borderRadius: "10px",
            background:
              selectedIds.length === 0 ? "#b8adc9" : "#5b21b6",
            color: "white",
            fontWeight: 900,
            cursor:
              selectedIds.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {bulkSending
            ? "Sending..."
            : `Send Email to Selected (${selectedIds.length})`}
        </button>
      </section>

      {message && (
        <div className="shortlist-success">{message}</div>
      )}

      {error && <div className="shortlist-error">{error}</div>}

      <section className="shortlist-table-card">
        {loading ? (
          <div className="shortlist-empty">
            Loading final shortlist...
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="shortlist-empty">
            No candidates found.
          </div>
        ) : (
          <div className="shortlist-table-wrapper">
            <table className="shortlist-table">
              <thead>
                <tr>
                  <th style={{ width: "42px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleVisibleSelection}
                      aria-label="Select all candidates on this page"
                      style={{ width: "17px", height: "17px" }}
                    />
                  </th>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Cohort</th>
                  <th>City</th>
                  <th>Total</th>
                  <th>Decision</th>
                  <th>Offer Letter</th>
                  <th>Confirmation</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleItems.map((item) => {
                  const draft = drafts[item.id] || {
                    offer_letter: item.offer_letter || "Not Sent",
                    acceptance_confirmation:
                      item.acceptance_confirmation || "Pending",
                  };

                  const offerOptions = getAvailableOptions(
                    draft.offer_letter,
                    OFFER_OPTIONS
                  );

                  const confirmationOptions = getAvailableOptions(
                    draft.acceptance_confirmation,
                    CONFIRMATION_OPTIONS
                  );

                  return (
                    <tr key={item.id}>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelection(item.id)}
                          aria-label={`Select applicant ${item.id}`}
                          style={{ width: "17px", height: "17px" }}
                        />
                      </td>

                      <td>
                        <strong title={item.id}>
                          {String(item.id).slice(0, 12)}...
                        </strong>
                        <small>Applicant</small>
                      </td>

                      <td>
                        {item.email ? (
                          <a
                            href={`mailto:${item.email}`}
                            className="shortlist-email"
                          >
                            {item.email}
                          </a>
                        ) : (
                          <span className="shortlist-no-email">
                            No email
                          </span>
                        )}
                      </td>

                      <td>{item.application_cohort || "-"}</td>
                      <td>{item.application_city || "-"}</td>

                      <td>
                        <b className="shortlist-score">
                          {item.total_score ?? 0}%
                        </b>
                      </td>

                      <td>
                        <span
                          className={`shortlist-badge ${badgeClass(
                            item.decision
                          )}`}
                        >
                          {item.decision || "Not decided"}
                        </span>
                      </td>

                      <td>
                        <select
                          value={draft.offer_letter || ""}
                          onChange={(event) =>
                            updateDraft(
                              item.id,
                              "offer_letter",
                              event.target.value
                            )
                          }
                        >
                          {offerOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <select
                          value={draft.acceptance_confirmation || ""}
                          onChange={(event) =>
                            updateDraft(
                              item.id,
                              "acceptance_confirmation",
                              event.target.value
                            )
                          }
                        >
                          {confirmationOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => handleSave(item.id)}
                          disabled={savingId === item.id}
                        >
                          {savingId === item.id ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="shortlist-pagination">
        <span>
          Page {page} of {totalPages}
        </span>

        <div>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              setPage((current) => Math.max(1, current - 1))
            }
          >
            Previous
          </button>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((current) =>
                Math.min(totalPages, current + 1)
              )
            }
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}

export default FinalShortlist;
