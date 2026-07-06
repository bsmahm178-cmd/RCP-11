import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";

import api from "../../services/api";

const PAGE_SIZE = 20;

function asText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function normalizeBoolean(value) {
  if (value === true || value === 1) {
    return true;
  }

  const text = asText(value).trim().toLowerCase();

  return ["true", "yes", "1"].includes(text);
}

function Applicants() {
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState("");
  const [graduated, setGraduated] = useState("all");
  const [employee, setEmployee] = useState("all");
  const [stage, setStage] = useState("all");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  async function fetchApplicants(currentPage = 1) {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/applicants", {
        params: {
          page: currentPage,
          page_size: PAGE_SIZE,
          search: search.trim() || undefined,
        },
      });

      const payload = response?.data;

      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

      setApplicants(items);

      setTotal(
        Array.isArray(payload)
          ? payload.length
          : Number(payload?.total ?? items.length)
      );

      setPages(
        Array.isArray(payload)
          ? 1
          : Math.max(1, Number(payload?.pages ?? 1))
      );

      setPage(
        Array.isArray(payload)
          ? 1
          : Math.max(1, Number(payload?.page ?? currentPage))
      );

      setSelectedIds([]);
    } catch (requestError) {
      console.error("Applicants request failed:", requestError);

      setApplicants([]);
      setError(
        requestError.response?.data?.detail ||
          requestError.message ||
          "Failed to load applicants."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setMessage("");
    setError("");

    try {
      await api.post("/import-excel", formData);

      setMessage("Excel file uploaded successfully.");
      await fetchApplicants(1);
    } catch (uploadError) {
      console.error("Applicants upload failed:", uploadError);

      setError(
        uploadError.response?.data?.detail ||
          uploadError.message ||
          "Failed to upload Excel file."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function toggleSelect(id) {
    const normalizedId = asText(id);

    setSelectedIds((currentIds) =>
      currentIds.includes(normalizedId)
        ? currentIds.filter(
            (selectedId) => selectedId !== normalizedId
          )
        : [...currentIds, normalizedId]
    );
  }

  const filteredApplicants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return applicants.filter((applicant) => {
      const applicantId = asText(applicant.id);
      const specialization = asText(
        applicant.specialization_name
      );
      const institution = asText(
        applicant.education_institution
      );
      const applicantStage =
        asText(applicant.stage).trim().toLowerCase() ||
        "applicant";

      const graduateValue = normalizeBoolean(
        applicant.is_graduate
      );
      const employeeValue = normalizeBoolean(
        applicant.is_employee
      );

      const matchesSearch =
        !keyword ||
        applicantId.toLowerCase().includes(keyword) ||
        specialization.toLowerCase().includes(keyword) ||
        institution.toLowerCase().includes(keyword);

      const matchesGraduated =
        graduated === "all" ||
        String(graduateValue) === graduated;

      const matchesEmployee =
        employee === "all" ||
        String(employeeValue) === employee;

      const matchesStage =
        stage === "all" || applicantStage === stage;

      return (
        matchesSearch &&
        matchesGraduated &&
        matchesEmployee &&
        matchesStage
      );
    });
  }, [
    applicants,
    employee,
    graduated,
    search,
    stage,
  ]);

  function toggleSelectAll() {
    const visibleIds = filteredApplicants.map((applicant) =>
      asText(applicant.id)
    );

    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) =>
        selectedIds.includes(id)
      );

    if (allVisibleSelected) {
      setSelectedIds((currentIds) =>
        currentIds.filter(
          (id) => !visibleIds.includes(id)
        )
      );
      return;
    }

    setSelectedIds((currentIds) => [
      ...new Set([...currentIds, ...visibleIds]),
    ]);
  }

  async function moveSelectedToInterview() {
    if (selectedIds.length === 0) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await api.patch(
        "/applicants/move-to-interview",
        selectedIds
      );

      setMessage(
        `${selectedIds.length} applicants moved to interview.`
      );

      setSelectedIds([]);
      await fetchApplicants(page);
    } catch (moveError) {
      console.error(
        "Move applicants failed:",
        moveError
      );

      setError(
        moveError.response?.data?.detail ||
          moveError.message ||
          "Failed to move applicants to interview."
      );
    }
  }

  async function copyApplicantId(id) {
    try {
      await navigator.clipboard.writeText(asText(id));
      setMessage("Applicant ID copied.");
    } catch {
      setMessage("Could not copy the applicant ID.");
    }
  }

  useEffect(() => {
    fetchApplicants(1);
  }, []);

  const visibleIds = filteredApplicants.map((applicant) =>
    asText(applicant.id)
  );

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) =>
      selectedIds.includes(id)
    );

  return (
    <section className="page applicants-page">
      <div className="page-header">
        <div>
          <h1>Applicants</h1>

          <p>
            Upload Excel sheets, filter applicants, and
            move qualified candidates to interviews.
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => fetchApplicants(1)}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={moveSelectedToInterview}
            disabled={selectedIds.length === 0}
          >
            Move Selected ({selectedIds.length})
          </button>

          <label className="upload-btn">
            <Upload size={17} />

            {uploading
              ? "Uploading..."
              : "Upload Excel"}

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUpload}
              disabled={uploading}
              hidden
            />
          </label>
        </div>
      </div>

      {message && (
        <div className="notice">{message}</div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="filters-card">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by ID, specialization, or university..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={graduated}
          onChange={(event) =>
            setGraduated(event.target.value)
          }
        >
          <option value="all">
            All Graduation Status
          </option>
          <option value="true">Graduated</option>
          <option value="false">
            Not Graduated
          </option>
        </select>

        <select
          value={employee}
          onChange={(event) =>
            setEmployee(event.target.value)
          }
        >
          <option value="all">
            All Employment Status
          </option>
          <option value="true">Employee</option>
          <option value="false">
            Not Employee
          </option>
        </select>

        <select
          value={stage}
          onChange={(event) =>
            setStage(event.target.value)
          }
        >
          <option value="all">All Stages</option>
          <option value="applicant">
            Applicant
          </option>
          <option value="interview">
            Interview
          </option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>Applicants ({total})</h3>

          <span>
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : `Showing ${filteredApplicants.length} on this page`}
          </span>
        </div>

        {loading ? (
          <p className="empty-state">
            Loading applicants...
          </p>
        ) : filteredApplicants.length === 0 ? (
          <p className="empty-state">
            No applicants found.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table applicants-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>ID</th>
                  <th>Specialization</th>
                  <th>University</th>
                  <th>Graduate?</th>
                  <th>Employee?</th>
                  <th>Stage</th>
                </tr>
              </thead>

              <tbody>
                {filteredApplicants.map(
                  (applicant) => {
                    const applicantId = asText(
                      applicant.id
                    );

                    const applicantStage =
                      asText(applicant.stage)
                        .trim()
                        .toLowerCase() ||
                      "applicant";

                    const graduateValue =
                      normalizeBoolean(
                        applicant.is_graduate
                      );

                    const employeeValue =
                      normalizeBoolean(
                        applicant.is_employee
                      );

                    return (
                      <tr key={applicantId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(
                              applicantId
                            )}
                            onChange={() =>
                              toggleSelect(
                                applicantId
                              )
                            }
                          />
                        </td>

                        <td
                          className="copy-id"
                          title={`Click to copy: ${applicantId}`}
                          onClick={() =>
                            copyApplicantId(
                              applicantId
                            )
                          }
                        >
                          {applicantId.length > 12
                            ? `${applicantId.slice(
                                0,
                                12
                              )}...`
                            : applicantId || "-"}
                        </td>

                        <td>
                          {asText(
                            applicant.specialization_name
                          ) || "-"}
                        </td>

                        <td>
                          {asText(
                            applicant.education_institution
                          ) || "-"}
                        </td>

                        <td>
                          <span
                            className={`status-chip ${
                              graduateValue
                                ? "yes-chip"
                                : "no-chip"
                            }`}
                          >
                            {graduateValue
                              ? "Yes"
                              : "No"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-chip ${
                              employeeValue
                                ? "yes-chip"
                                : "no-chip"
                            }`}
                          >
                            {employeeValue
                              ? "Yes"
                              : "No"}
                          </span>
                        </td>

                        <td>
                          <span className="stage-chip">
                            {applicantStage ===
                            "interview"
                              ? "Interview"
                              : "Applicant"}
                          </span>
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

      {pages > 1 && (
        <div className="pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              fetchApplicants(page - 1)
            }
          >
            ◀ Previous
          </button>

          <span>
            Page {page} of {pages}
          </span>

          <button
            type="button"
            disabled={page >= pages}
            onClick={() =>
              fetchApplicants(page + 1)
            }
          >
            Next ▶
          </button>
        </div>
      )}
    </section>
  );
}

export default Applicants;
