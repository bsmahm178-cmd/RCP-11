import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarCheck,
  ListChecks,
  UserCog,
  LogOut,
  Mail
} from "lucide-react";

import { Users as UsersIcon } from "lucide-react";



function AdminLayout() {
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
          <NavLink to="/admin/dashboard">
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink to="/admin/applicants">
            <Users size={18} />
            Applicants
          </NavLink>

          <NavLink to="/admin/assessments">
            <ClipboardList size={18} />
            Assessments
          </NavLink>

          <NavLink to="/admin/interviews">
            <CalendarCheck size={18} />
            Interviews
          </NavLink>

          <NavLink to="/admin/final-shortlist">
            <ListChecks size={18} />
            Final Shortlist
          </NavLink>

<NavLink to="/admin/emails">
  <Mail size={18} />
  Emails
</NavLink>


          <NavLink to="/admin/users">
  <UsersIcon size={18} />
  Users
</NavLink>
        </nav>

        <button className="logout-btn" onClick={logout}>
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

export default AdminLayout;