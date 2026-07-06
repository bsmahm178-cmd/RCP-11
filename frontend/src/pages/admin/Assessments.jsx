import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { Search, RefreshCw } from "lucide-react";

function Assessments() {
  const [assessments, setAssessments] = useState([]);
  const [search, setSearch] = useState("");
  const [minEnglish, setMinEnglish] = useState(70);
  const [minTechnical, setMinTechnical] = useState(80);
  const [maxCheat, setMaxCheat] = useState(0);
  const [showQualifiedOnly, setShowQualifiedOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
const [total, setTotal] = useState(0);
const [pages, setPages] = useState(1);

const pageSize = 20;
const filtersApplied = showQualifiedOnly;

 async function fetchAssessments(currentPage = page, applyFilters = false) {
  setLoading(true);
  setMessage("");

  try {
    const response = await api.get("/assessments", {
      params: {
        page: currentPage,
        page_size: pageSize,
        search: search || undefined,
        min_english: applyFilters ? Number(minEnglish) : undefined,
        min_technical: applyFilters ? Number(minTechnical) : undefined,
        max_cheat: applyFilters ? Number(maxCheat) : undefined,
      },
    });

    setAssessments(response.data.items || []);
    setTotal(response.data.total || 0);
    setPages(response.data.pages || 1);
    setPage(response.data.page || 1);
  } catch {
    setMessage("Failed to load assessments.");
  } finally {
    setLoading(false);
  }
}

  async function moveQualifiedToInterview() {
    setMessage("");

    try {
      const response = await api.patch("/assessments/move-qualified-to-interview", {
        min_english: Number(minEnglish),
        min_technical: Number(minTechnical),
        max_cheat: Number(maxCheat),
      });

      setMessage(`${response.data.count} qualified applicants moved to interview.`);
      setShowQualifiedOnly(false);
fetchAssessments(1, false);
    } catch {
      setMessage("Failed to move qualified applicants.");
    }
  }

  function isQualified(item) {
    const english = Number(item.english_score_percent || 0) * 100;
    const technical = Number(item.technical_score || 0) * 100;
    const cheat = Number(item.cheat_score || 0);

    return (
      english >= Number(minEnglish) &&
      technical >= Number(minTechnical) &&
      cheat <= Number(maxCheat)
    );
  }

  useEffect(() => {
    fetchAssessments();
  }, []);

  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      const keyword = search.toLowerCase();

      const matchesSearch = item.id?.toLowerCase().includes(keyword);

      const matchesQualified =
        !showQualifiedOnly || isQualified(item);

      return matchesSearch && matchesQualified;
    });
  }, [assessments, search, showQualifiedOnly, minEnglish, minTechnical, maxCheat]);
  

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Assessments</h1>
          <p>
            Filter candidates by assessment scores and move qualified applicants
            to interviews.
          </p>
        </div>

        <div className="page-actions">
         <button

  className="secondary-btn"
  onClick={() => {
    setShowQualifiedOnly(true);
    fetchAssessments(1, true);
  }}
>
  Apply Qualification Filter
</button>

         <button
  className="upload-btn"
  onClick={moveQualifiedToInterview}
  disabled={!showQualifiedOnly || total === 0}
  title={
    !showQualifiedOnly
      ? "Apply Qualification Filter first"
      : total === 0
      ? "No qualified candidates"
      : "Move qualified candidates to interview"
  }
>
  {showQualifiedOnly
    ? `Move ${total} Qualified Candidates → Interview`
    : "Apply Qualification Filter First"}
</button>
        </div>
      </div>

      {message && <div className="notice">{message}</div>}

      <div className="filters-card assessment-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by applicant ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <input
          type="number"
          value={minEnglish}
          onChange={(e) => setMinEnglish(e.target.value)}
          placeholder="Min English"
        />

        <input
          type="number"
          value={minTechnical}
          onChange={(e) => setMinTechnical(e.target.value)}
          placeholder="Min Technical"
        />

        <input
          type="number"
          value={maxCheat}
          onChange={(e) => setMaxCheat(e.target.value)}
          placeholder="Max Cheat"
        />

        <button
  className="secondary-btn"
  onClick={() => {
    setShowQualifiedOnly(false);
    fetchAssessments(1, false);
  }}
>
  Show All
</button>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>Assessments ({total})</h3>
          <span>
            English ≥ {minEnglish}% · Technical ≥ {minTechnical}% · Cheat ≤ {maxCheat}
          </span>
        </div>

        {loading ? (
          <p className="empty-state">Loading assessments...</p>
        ) : filteredAssessments.length === 0 ? (
          <p className="empty-state">No assessments found.</p>
        ) : (
          <table className="data-table applicants-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>English</th>
                <th>Technical</th>
                <th>Test Time</th>
                <th>Cheat</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredAssessments.map((item) => {
                const english = Number(item.english_score_percent || 0) * 100;
                const technical = Number(item.technical_score || 0) * 100;
                const qualified = isQualified(item);

                return (
                  <tr key={item.id}>
                    <td
                      title={item.id}
                      className="copy-id"
                      onClick={() => navigator.clipboard.writeText(item.id)}
                    >
                      {item.id.slice(0, 12)}...
                    </td>
                    <td>{english.toFixed(0)}%</td>
                    <td>{technical.toFixed(0)}%</td>
                    <td>{item.test_time_index}</td>
                    <td>{item.cheat_score}</td>
                    <td>
                      <span className={`status-chip ${qualified ? "yes-chip" : "no-chip"}`}>
                        {qualified ? "Qualified" : "Not Qualified"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
     <div className="pagination">
  <button
    disabled={page === 1}
    onClick={() => fetchAssessments(page - 1, filtersApplied)}
  >
    ◀ Previous
  </button>

  {Array.from({ length: pages }, (_, index) => index + 1)
    .filter((pageNumber) => {
      return (
        pageNumber === 1 ||
        pageNumber === pages ||
        Math.abs(pageNumber - page) <= 2
      );
    })
    .map((pageNumber, index, array) => {
      const previousPage = array[index - 1];
      const showDots = previousPage && pageNumber - previousPage > 1;

      return (
        <span key={pageNumber} className="pagination-group">
          {showDots && <span className="pagination-dots">...</span>}

          <button
            className={pageNumber === page ? "active-page" : ""}
            onClick={() => fetchAssessments(pageNumber, filtersApplied)}
          >
            {pageNumber}
          </button>
        </span>
      );
    })}

  <button
    disabled={page === pages}
    onClick={() => fetchAssessments(page + 1, filtersApplied)}
  >
    Next ▶
  </button>
</div>


    </section>

    
  );
}

export default Assessments;