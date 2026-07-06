import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  Users as UsersIcon,
} from "lucide-react";

import api from "../../services/api";
import "./Users.css";


function getFullName(user) {
  const fullName = [
    user?.first_name,
    user?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user?.username || "Unnamed User";
}


function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [promotingId, setPromotingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  async function loadUsers() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.get("/users");

      setUsers(
        Array.isArray(response?.data)
          ? response.data
          : []
      );
    } catch (requestError) {
      console.error("Users loading error:", requestError);

      setError(
        requestError.response?.data?.detail ||
          requestError.message ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadUsers();
  }, []);


  const statistics = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(
        (user) => user.role === "admin"
      ).length,
      coordinators: users.filter(
        (user) => user.role === "coordinator"
      ).length,
      interviewers: users.filter(
        (user) => user.role === "interviewer"
      ).length,
    };
  }, [users]);


  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const searchableText = [
        user.first_name,
        user.last_name,
        user.username,
        user.email,
        user.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !keyword || searchableText.includes(keyword);

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, search, users]);


  async function makeAdmin(user) {
    const confirmed = window.confirm(
      `Make ${getFullName(user)} an admin?`
    );

    if (!confirmed) {
      return;
    }

    setPromotingId(user.id);
    setError("");
    setMessage("");

    try {
      const response = await api.patch(
        `/users/${user.id}/make-admin`
      );

      const updatedUser = response?.data?.user;

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                ...(updatedUser || {}),
                role: "admin",
              }
            : currentUser
        )
      );

      setMessage(
        `${getFullName(user)} is now an admin.`
      );
    } catch (requestError) {
      console.error("Promote user error:", requestError);

      setError(
        requestError.response?.data?.detail ||
          requestError.message ||
          "Failed to promote the user."
      );
    } finally {
      setPromotingId(null);
    }
  }


  return (
    <section className="users-page">
      <header className="users-page-header">
        <div>
          <span>ACCOUNT MANAGEMENT</span>
          <h1>Users</h1>
          <p>
            View coordinator and interviewer accounts,
            and promote trusted users to administrators.
          </p>
        </div>

        <button
          type="button"
          className="users-refresh-button"
          onClick={loadUsers}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <section className="users-stats">
        <article>
          <div className="users-stat-icon purple">
            <UsersIcon size={21} />
          </div>
          <span>Total Users</span>
          <strong>{statistics.total}</strong>
        </article>

        <article>
          <div className="users-stat-icon violet">
            <ShieldCheck size={21} />
          </div>
          <span>Admins</span>
          <strong>{statistics.admins}</strong>
        </article>

        <article>
          <div className="users-stat-icon blue">
            <UserCog size={21} />
          </div>
          <span>Coordinators</span>
          <strong>{statistics.coordinators}</strong>
        </article>

        <article>
          <div className="users-stat-icon green">
            <UserCog size={21} />
          </div>
          <span>Interviewers</span>
          <strong>{statistics.interviewers}</strong>
        </article>
      </section>

      {message && (
        <div className="users-success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="users-error-message">
          {error}
        </div>
      )}

      <section className="users-filters">
        <div className="users-search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by name, username, email, or role..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(event.target.value)
          }
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="coordinator">
            Coordinators
          </option>
          <option value="interviewer">
            Interviewers
          </option>
        </select>
      </section>

      <section className="users-table-card">
        <div className="users-table-heading">
          <div>
            <h2>User Accounts</h2>
            <p>
              Passwords are protected and are never
              displayed.
            </p>
          </div>

          <strong>
            {filteredUsers.length} users
          </strong>
        </div>

        {loading ? (
          <div className="users-empty-state">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="users-empty-state">
            No users found.
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="users-person">
                        <div className="users-avatar">
                          {getFullName(user)
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {getFullName(user)}
                          </strong>
                          <span>
                            Account #{user.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {user.username || "-"}
                    </td>

                    <td>{user.email}</td>

                    <td>
                      <span
                        className={`users-role-badge ${user.role}`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td>
                      {user.role === "admin" ? (
                        <span className="users-admin-label">
                          <ShieldCheck size={16} />
                          Admin
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="users-promote-button"
                          onClick={() => makeAdmin(user)}
                          disabled={
                            promotingId === user.id
                          }
                        >
                          <ShieldCheck size={16} />

                          {promotingId === user.id
                            ? "Promoting..."
                            : "Make Admin"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}


export default Users;
