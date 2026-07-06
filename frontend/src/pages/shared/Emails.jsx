import { useMemo, useState } from "react";
import "./Emails.css";

const STORAGE_KEY = "flowin_simulated_email_history";

const templates = {
  interview_invitation: {
    label: "Interview Invitation",
    subject: "FLOWIN Interview Invitation",
    body: `Dear Applicant,\n\nYou have been selected for an interview with FLOWIN.\n\nBest regards,\nFLOWIN Admissions Team`,
  },
  accepted: {
    label: "Acceptance",
    subject: "FLOWIN Admission Decision - Accepted",
    body: `Dear Applicant,\n\nCongratulations! You have been accepted into the program.\n\nBest regards,\nFLOWIN Admissions Team`,
  },
  backup: {
    label: "Waiting List",
    subject: "FLOWIN Admission Decision - Waiting List",
    body: `Dear Applicant,\n\nYour application has been placed on the waiting list.\n\nBest regards,\nFLOWIN Admissions Team`,
  },
  rejected: {
    label: "Rejection",
    subject: "FLOWIN Admission Decision",
    body: `Dear Applicant,\n\nThank you for your interest. We are unable to offer you a place at this time.\n\nBest regards,\nFLOWIN Admissions Team`,
  },
};

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function Emails() {
  const role = String(localStorage.getItem("role") || "admin").toLowerCase();
  const allowedTypes = useMemo(
    () =>
      role === "coordinator"
        ? ["interview_invitation"]
        : ["interview_invitation", "accepted", "backup", "rejected"],
    [role]
  );

  const [tab, setTab] = useState("send");
  const [emailType, setEmailType] = useState(allowedTypes[0]);
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState(templates[allowedTypes[0]].subject);
  const [body, setBody] = useState(templates[allowedTypes[0]].body);
  const [history, setHistory] = useState(loadHistory);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  function changeTemplate(type) {
    setEmailType(type);
    setSubject(templates[type].subject);
    setBody(templates[type].body);
  }

  function sendEmail(event) {
    event.preventDefault();
    setError("");

    const emailList = recipients
      .split(/[;,\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!emailList.length) {
      setError("Enter at least one recipient email.");
      return;
    }

    const sentAt = new Date().toISOString();
    const sentBy = localStorage.getItem("first_name") || "Admin";
    const records = emailList.map((email, index) => ({
      id: `${Date.now()}-${index}`,
      recipient_email: email,
      email_type: emailType,
      subject: subject.trim(),
      body: body.trim(),
      status: "Simulated",
      sent_by: sentBy,
      sent_at: sentAt,
    }));

    const updated = [...records, ...history];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setHistory(updated);
    setSuccess({
      count: emailList.length,
      type: templates[emailType].label,
      subject,
      recipients: emailList,
      sentAt,
    });
  }

  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }

  if (success) {
    return (
      <section className="email-page">
        <div className="email-success-card">
          <div className="email-success-icon">✓</div>
          <span className="email-badge">MVP Simulation</span>
          <h1>Email Sent Successfully</h1>
          <p>No real email was sent. The operation was saved in Email History.</p>

          <div className="email-success-grid">
            <div><span>Recipients</span><strong>{success.count}</strong></div>
            <div><span>Type</span><strong>{success.type}</strong></div>
            <div><span>Subject</span><strong>{success.subject}</strong></div>
            <div><span>Date</span><strong>{new Date(success.sentAt).toLocaleString()}</strong></div>
          </div>

          <div className="email-actions">
            <button className="secondary-button" onClick={() => setSuccess(null)}>
              Send Another Email
            </button>
            <button className="primary-button" onClick={() => { setSuccess(null); setTab("history"); }}>
              View Email History
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="email-page">
      <div className="email-header">
        <div>
          
          <h1>Emails</h1>
          <p>Simulate admission emails for the FLOWIN MVP.</p>
        </div>
      </div>

      <div className="email-tabs">
        <button className={tab === "send" ? "active" : ""} onClick={() => setTab("send")}>Send Email</button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>Email History</button>
      </div>

      {tab === "send" ? (
        <form className="email-form" onSubmit={sendEmail}>
          <div className="simulation-note">MVP simulation only. No real email will be sent.</div>
          {error && <div className="email-error">{error}</div>}

          <label>
            Email Type
            <select value={emailType} onChange={(e) => changeTemplate(e.target.value)}>
              {allowedTypes.map((type) => (
                <option key={type} value={type}>{templates[type].label}</option>
              ))}
            </select>
          </label>

          <label>
            Recipient Emails
            <textarea
              rows="3"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="first@email.com, second@email.com"
            />
          </label>

          <label>
            Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>

          <label>
            Message
            <textarea rows="11" value={body} onChange={(e) => setBody(e.target.value)} />
          </label>

          <button className="primary-button" type="submit">Send Email</button>
        </form>
      ) : (
        <div className="email-history-card">
          <div className="history-title">
            <div><h2>Email History</h2><p>Simulated operations stored in this browser.</p></div>
            {history.length > 0 && <button className="clear-button" onClick={clearHistory}>Clear History</button>}
          </div>

          {history.length === 0 ? (
            <div className="empty-history">No simulated emails yet.</div>
          ) : (
            <div className="email-table-wrap">
              <table className="email-table">
                <thead>
                  <tr><th>Recipient</th><th>Type</th><th>Subject</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>{item.recipient_email}</td>
                      <td>{templates[item.email_type]?.label || item.email_type}</td>
                      <td>{item.subject}</td>
                      <td><span className="status-badge">Simulated</span></td>
                      <td>{new Date(item.sent_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Emails;
