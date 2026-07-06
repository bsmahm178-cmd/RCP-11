import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ListChecks,
  MapPin,
  RefreshCw,
  TrendingUp,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { getDashboardData, uploadDashboardExcel } from "../../services/dashboard";
import "./Dashboard.css";

function numberValue(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function formatNumber(value) {
  return String(numberValue(value));
}

function normalizeDecisionCounts(decisions = {}) {
  const normalized = {
    accepted: 0,
    backup: 0,
    rejected: 0,
  };

  Object.entries(decisions || {}).forEach(([key, value]) => {
    const decision = String(key || "").trim().toLowerCase();
    const count = numberValue(value);

    if (decision === "accepted") {
      normalized.accepted += count;
    } else if (decision === "backup" || decision === "waiting list") {
      normalized.backup += count;
    } else if (decision === "rejected") {
      normalized.rejected += count;
    }
  });

  return normalized;
}

function formatRole(role) {
  if (role === "coordinator") return "Coordinator";
  return "Admin";
}

function Dashboard() {
  const role = String(localStorage.getItem("role") || "admin").toLowerCase();
  const fileInputRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [importMessage, setImportMessage] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await getDashboardData();
      setData(response.data || {});
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleExcelUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls"].includes(extension)) {
      setError("Please select an Excel file (.xlsx or .xls).");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setError("");
    setImportMessage("");

    try {
      const response = await uploadDashboardExcel(file);
      const counts = response.data?.counts || {};

      const summary = Object.entries(counts)
        .map(([key, value]) => `${key}: ${value}`)
        .join(" • ");

      setImportMessage(
        summary
          ? `Excel imported successfully — ${summary}`
          : "Excel imported successfully."
      );

      await loadDashboard();
    } catch (err) {
      console.error("Excel upload error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to import the Excel file"
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const source = data || {};

    return [
      {
        key: "applicants",
        label: "Applicants",
        value: numberValue(source.applicants),
        icon: Users,
        tone: "purple",
        note: "Applicant records imported from Excel",
      },
      {
        key: "assessments",
        label: "Assessments",
        value: numberValue(source.assessments),
        icon: ClipboardCheck,
        tone: "green",
        note: "Assessment records imported from Excel",
      },
      {
        key: "interviews",
        label: "Interviews",
        value: numberValue(source.interviews),
        icon: CalendarCheck2,
        tone: "orange",
        note: "Interview records imported from Excel",
      },
      {
        key: "shortlisted",
        label: "Final Shortlist",
        value: numberValue(source.shortlisted),
        icon: ListChecks,
        tone: "red",
        note: "Current final shortlist records",
      },
    ];
  }, [data]);

  const decisions = useMemo(
    () => normalizeDecisionCounts(data?.decisions),
    [data]
  );

  const cities = useMemo(() => {
    return Object.entries(data?.top_cities || {})
      .map(([city, count]) => ({
        city: city || "Unknown",
        count: numberValue(count),
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const largestMetric = Math.max(
    1,
    ...metrics.map((item) => item.value)
  );

  const largestCity = Math.max(
    1,
    ...cities.map((item) => item.count)
  );

  if (loading) {
    return (
      <section className="flowin-dashboard">
        <div className="dashboard-state-card">
          <div className="dashboard-spinner" />
          <p>Loading dashboard data...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flowin-dashboard">
      <header className="dashboard-page-heading">
        <div>
          <span>ADMISSION WORKFLOW OVERVIEW</span>
          <h1>{formatRole(role)} Dashboard</h1>
          <p>
            Live statistics calculated from the records imported from the Excel
            workbook.
          </p>
        </div>

        <div className="dashboard-heading-actions">
          <input
            ref={fileInputRef}
            className="dashboard-file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
          />

          <button
            type="button"
            className="dashboard-upload-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={17} />
            {uploading ? "Importing..." : "Upload Excel"}
          </button>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={loadDashboard}
            disabled={loading || uploading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </header>

      {error && <div className="dashboard-error">{error}</div>}

      {importMessage && (
        <div className="dashboard-import-success">{importMessage}</div>
      )}

      <section className="dashboard-kpi-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article
              key={metric.key}
              className={`dashboard-kpi-card ${metric.tone}`}
            >
              <div className="dashboard-kpi-top">
                <div>
                  <span>{metric.label}</span>
                  <strong>{formatNumber(metric.value)}</strong>
                </div>

                <div className="dashboard-kpi-icon">
                  <Icon size={23} />
                </div>
              </div>

              <p>{metric.note}</p>
            </article>
          );
        })}
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-wide-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>EXCEL RECORDS</span>
              <h2>Workflow Data Overview</h2>
            </div>
            <TrendingUp size={22} />
          </div>

          <div className="workflow-bars">
            {metrics.map((metric) => (
              <div className="workflow-bar-row" key={metric.key}>
                <div className="workflow-bar-label">
                  <span>{metric.label}</span>
                  <strong>{formatNumber(metric.value)}</strong>
                </div>

                <div className="workflow-bar-track">
                  <div
                    className={`workflow-bar-fill ${metric.tone}`}
                    style={{
                      width: `${Math.max(
                        metric.value > 0 ? 7 : 0,
                        (metric.value / largestMetric) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="dashboard-data-note">
            These are record counts, not invented conversion percentages. Some
            Excel sheets can contain more rows than other stages.
          </p>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>FINAL DECISIONS</span>
              <h2>Decision Summary</h2>
            </div>
          </div>

          <div className="decision-list">
            <div className="decision-item accepted">
              <div className="decision-icon">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span>Accepted</span>
                <strong>{formatNumber(decisions.accepted)}</strong>
              </div>
            </div>

            <div className="decision-item backup">
              <div className="decision-icon">
                <Clock3 size={20} />
              </div>
              <div>
                <span>Waiting List</span>
                <strong>{formatNumber(decisions.backup)}</strong>
              </div>
            </div>

            <div className="decision-item rejected">
              <div className="decision-icon">
                <XCircle size={20} />
              </div>
              <div>
                <span>Rejected</span>
                <strong>{formatNumber(decisions.rejected)}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="dashboard-panel dashboard-cities-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>INTERVIEW DATA</span>
              <h2>Top Interview Cities</h2>
            </div>
            <MapPin size={22} />
          </div>

          {cities.length === 0 ? (
            <div className="dashboard-empty-state">
              No city records are available yet.
            </div>
          ) : (
            <div className="city-list">
              {cities.map((item, index) => (
                <div className="city-row" key={`${item.city}-${index}`}>
                  <div className="city-row-heading">
                    <span>{item.city}</span>
                    <strong>{formatNumber(item.count)}</strong>
                  </div>

                  <div className="city-bar-track">
                    <div
                      className="city-bar-fill"
                      style={{
                        width: `${Math.max(
                          8,
                          (item.count / largestCity) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </section>
  );
}

export default Dashboard;
