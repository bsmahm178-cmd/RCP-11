import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import CoordinatorDashboard from "../pages/coordinator/Dashboard";
import Login from "../pages/auth/Login";

import AdminLayout from "../layouts/AdminLayout";
import CoordinatorLayout from "../layouts/CoordinatorLayout";

import AdminDashboard from "../pages/admin/Dashboard";
import Applicants from "../pages/admin/Applicants";
import Assessments from "../pages/admin/Assessments";
import AdminInterviews from "../pages/admin/Interviews";
import FinalShortlist from "../pages/admin/FinalShortlist";
import Users from "../pages/admin/Users";
import Emails from "../pages/shared/Emails";


import AssignInterviews from "../pages/coordinator/AssignInterviews";
import InterviewerDashboard from "../pages/interviewer/Dashboard";

import UsersPage from "../pages/admin/Users";



function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Admin routes */}
<Route path="/admin" element={<AdminLayout />}   
  >
      <Route path="dashboard" element={<AdminDashboard />} />
        <Route
          index
          element={
            <Navigate
              to="/admin/dashboard"
              replace
            />
          }
        />

        <Route
          path="dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="applicants"
          element={<Applicants />}
        />

        <Route
          path="assessments"
          element={<Assessments />}
        />

        <Route
          path="interviews"
          element={<AdminInterviews />}
        />

        <Route
          path="final-shortlist"
          element={<FinalShortlist />}
        />
        <Route path="emails" element={<Emails />} />
       <Route path="users" element={<UsersPage />} />
      </Route>

      {/* Coordinator routes */}
      <Route path="/coordinator" element={<CoordinatorLayout />}  >
        <Route path="dashboard" element={<CoordinatorDashboard />} />

      
      <Route
          index
          element={
            <Navigate
              to="/coordinator/dashboard"
              replace
            />
          }
        />

        <Route
          path="dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="applicants"
          element={<Applicants />}
        />

        <Route
          path="assessments"
          element={<Assessments />}
        />

        <Route
          path="interviews"
          element={<AssignInterviews />}
        />
      </Route>

      {/* Interviewer routes */}
      <Route
        path="/interviewer/dashboard"
        element={<InterviewerDashboard />}
      />

      <Route
        path="/interviewer"
        element={
          <Navigate
            to="/interviewer/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default AppRouter;

