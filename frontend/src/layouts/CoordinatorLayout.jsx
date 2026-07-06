import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarCheck,
  LogOut,
} from "lucide-react";

function CoordinatorLayout() {
  const navigate = useNavigate();

  function logout() {
    localStorage.clear();
    navigate("/");
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Flowin</div>

        <nav className="sidebar-nav">
          <NavLink to="/coordinator/dashboard">
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink to="/coordinator/applicants">
            <Users size={18} />
            Applicants
          </NavLink>

          <NavLink to="/coordinator/assessments">
            <ClipboardList size={18} />
            Assessments
          </NavLink>

          <NavLink to="/coordinator/interviews">
            <CalendarCheck size={18} />
            Interviews
          </NavLink>
        </nav>

        <button
          type="button"
          className="logout-btn"
          onClick={logout}
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

export default CoordinatorLayout;
