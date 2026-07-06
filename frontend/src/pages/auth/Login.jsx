
import { useState } from "react";
import {
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";

import {
  loginUser,
  registerUser,
} from "../../services/auth.js";

function Login() {
  const [mode, setMode] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({
    first_name: "Admin",
    password: "admin123",
    role: "admin",
  });

  const [registerForm, setRegisterForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "interviewer",
  });

  function redirectByRole(role) {
    const normalizedRole = String(role || "")
      .trim()
      .toLowerCase();

    if (normalizedRole === "admin") {
      window.location.href = "/admin/dashboard";
      return;
    }

    if (normalizedRole === "coordinator") {
      window.location.href =
        "/coordinator/dashboard";
      return;
    }

    window.location.href =
      "/interviewer/dashboard";
  }

  async function handleLogin(event) {
    event.preventDefault();

    setError("");

    if (
      !loginForm.first_name.trim() ||
      !loginForm.password ||
      !loginForm.role
    ) {
      setError(
        "First name, password, and role are required."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser({
        first_name:
          loginForm.first_name.trim(),
        password: loginForm.password,
        role: loginForm.role.toLowerCase(),
      });

      const data = response?.data ?? response;

      if (!data?.access_token) {
        throw new Error(
          "Access token was not returned."
        );
      }

      const userRole =
        data.role || loginForm.role;

      const firstName =
        data.first_name ||
        loginForm.first_name.trim();

      localStorage.setItem(
        "token",
        data.access_token
      );

      localStorage.setItem(
        "role",
        String(userRole).toLowerCase()
      );

      localStorage.setItem(
        "first_name",
        firstName
      );

      redirectByRole(userRole);
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Invalid first name, password, or role."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    setError("");

    if (
      !registerForm.first_name.trim() ||
      !registerForm.last_name.trim() ||
      !registerForm.email.trim() ||
      !registerForm.password ||
      !registerForm.role
    ) {
      setError("Please complete all fields.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        first_name:
          registerForm.first_name.trim(),
        last_name:
          registerForm.last_name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        role: registerForm.role.toLowerCase(),
      });

      setLoginForm({
        first_name:
          registerForm.first_name.trim(),
        password: registerForm.password,
        role: registerForm.role,
      });

      setMode("signin");
      setError("");
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.response?.data?.detail ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function showSignIn() {
    setMode("signin");
    setError("");
  }

  function showSignUp() {
    setMode("signup");
    setError("");
  }

  return (
    <div className="auth-page">
      <section className="auth-brand">
        <div className="brand-logo">
          <span>Flowin</span>
          <Sparkles size={34} />
        </div>

        <h1>
          Admission Management Platform
        </h1>


      
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={
                mode === "signin"
                  ? "active"
                  : ""
              }
              onClick={showSignIn}
            >
              Sign In
            </button>

            <button
              type="button"
              className={
                mode === "signup"
                  ? "active"
                  : ""
              }
              onClick={showSignUp}
            >
              Create Account
            </button>
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleLogin}>
              <h2>Welcome back</h2>

              <p className="auth-subtitle">
                Sign in to continue to Flowin.
              </p>

              <label htmlFor="login-first-name">
                First Name
              </label>

              <div className="input-group">
                <User size={18} />

                <input
                  id="login-first-name"
                  type="text"
                  value={
                    loginForm.first_name
                  }
                  onChange={(event) =>
                    setLoginForm({
                      ...loginForm,
                      first_name:
                        event.target.value,
                    })
                  }
                  placeholder="First name"
                  required
                />
              </div>

              <label htmlFor="login-password">
                Password
              </label>

              <div className="input-group">
                <Lock size={18} />

                <input
                  id="login-password"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm({
                      ...loginForm,
                      password:
                        event.target.value,
                    })
                  }
                  placeholder="Enter your password"
                  required
                />
              </div>

              <label htmlFor="login-role">
                Role
              </label>

              <select
                id="login-role"
                value={loginForm.role}
                onChange={(event) =>
                  setLoginForm({
                    ...loginForm,
                    role: event.target.value,
                  })
                }
              >
                <option value="admin">
                  Admin
                </option>

                <option value="coordinator">
                  Coordinator
                </option>

                <option value="interviewer">
                  Interviewer
                </option>
              </select>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <h2>Create account</h2>

              <p className="auth-subtitle">
                Register as Coordinator or
                Interviewer.
              </p>

              <div className="form-row">
                <div>
                  <label htmlFor="register-first-name">
                    First Name
                  </label>

                  <div className="input-group">
                    <User size={18} />

                    <input
                      id="register-first-name"
                      type="text"
                      value={
                        registerForm.first_name
                      }
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          first_name:
                            event.target.value,
                        })
                      }
                      placeholder="First name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-last-name">
                    Last Name
                  </label>

                  <div className="input-group">
                    <User size={18} />

                    <input
                      id="register-last-name"
                      type="text"
                      value={
                        registerForm.last_name
                      }
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          last_name:
                            event.target.value,
                        })
                      }
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
              </div>

              <label htmlFor="register-email">
                Email Address
              </label>

              <div className="input-group">
                <Mail size={18} />

                <input
                  id="register-email"
                  type="email"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      email:
                        event.target.value,
                    })
                  }
                  placeholder="Email address"
                  required
                />
              </div>

              <label htmlFor="register-password">
                Password
              </label>

              <div className="input-group">
                <Lock size={18} />

                <input
                  id="register-password"
                  type="password"
                  value={
                    registerForm.password
                  }
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      password:
                        event.target.value,
                    })
                  }
                  placeholder="Password"
                  required
                />
              </div>

              <label htmlFor="register-role">
                Role
              </label>

              <select
                id="register-role"
                value={registerForm.role}
                onChange={(event) =>
                  setRegisterForm({
                    ...registerForm,
                    role: event.target.value,
                  })
                }
              >
                <option value="interviewer">
                  Interviewer
                </option>

                <option value="coordinator">
                  Coordinator
                </option>
              </select>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export default Login;

