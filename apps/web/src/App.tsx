import { useEffect, useState, type FormEvent } from "react";
import "./App.css";
import Dashboard from "./Dashboard";

type AuthMode = "login" | "signup";

type AccountUser = {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  createdAt: string;
};

type ApiResponse = {
  user?: AccountUser;
  error?: string;
  details?: {
    field: string;
    message: string;
  }[];
};

const API_BASE_URL = import.meta.env.DEV ? "http://localhost:3000" : "";

function App() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [currentUser, setCurrentUser] = useState<AccountUser | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";

  useEffect(() => {
    let keepState = true;

    async function checkSavedLogin() {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const result: ApiResponse = await response.json();

        if (keepState && result.user) {
          setCurrentUser(result.user);
        }
      } catch {
        // Keep the sign-in form available if the API is offline.
      }
    }

    void checkSavedLogin();

    return () => {
      keepState = false;
    };
  }, []);

  function chooseMode(nextMode: AuthMode) {
    setMode(nextMode);
    setNotice("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const isCreatingAccount = mode === "signup";

    const payload = isCreatingAccount
      ? {
          firstName: String(formData.get("firstName") ?? ""),
          lastName: String(formData.get("lastName") ?? ""),
          email: String(formData.get("email") ?? ""),
          mobileNumber: String(formData.get("mobileNumber") ?? ""),
          password: String(formData.get("password") ?? ""),
        }
      : {
          identifier: String(formData.get("identifier") ?? ""),
          password: String(formData.get("password") ?? ""),
        };

    setIsSubmitting(true);
    setNotice("");
    setError("");

    try {
      const action = isCreatingAccount ? "signup" : "login";

      const response = await fetch(`${API_BASE_URL}/auth/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        setError(
          result.details?.[0]?.message ??
            result.error ??
            "The request could not be completed.",
        );
        return;
      }

      if (isCreatingAccount) {
        setCurrentUser(null);
        setMode("login");
        setNotice("Account created. You can now sign in.");
        return;
      }

      if (!result.user) {
        setError("The API did not return an account profile.");
        return;
      }

      setCurrentUser(result.user);
    } catch {
      setError(
        "Could not reach the API. Check that it is running at http://localhost:3000.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const result: ApiResponse = await response.json();
        setError(result.error ?? "Could not sign out.");
        return;
      }

      setCurrentUser(null);
      setMode("login");
      setNotice("You have signed out.");
    } catch {
      setError(
        "Could not reach the API. Check that it is running at http://localhost:3000.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }
  if (Boolean(currentUser)) {
    return (
      <Dashboard
        user={currentUser!}
        onSignOut={() => void handleLogout()}
        isSigningOut={isSubmitting}
        signOutError={error}
      />
    );
  }

  return (
    <main className="page-shell">
      <section className="auth-card">
        <aside className="welcome-panel">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">A</span>
            <span>ACCOUNT PORTAL</span>
          </div>

          <div className="welcome-copy">
            <p className="eyebrow">YOUR ACCOUNT, IN ONE PLACE</p>
            <h1>Good to<br />have you here.</h1>
            <p className="welcome-description">
              Sign in with your email or mobile number, or create an account
              in a few steps.
            </p>
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-number">01</span>
              <span>Email or mobile sign-in</span>
            </div>
            <div className="feature-item">
              <span className="feature-number">02</span>
              <span>A simple account profile</span>
            </div>
          </div>

          <p className="panel-footer">ACCOUNT ACCESS · WEB</p>
        </aside>

        <section className="form-panel">
          <div className="form-topline">
            <span>ACCOUNT ACCESS</span>
            <span className="status-label">
              <span className="status-dot" />
              {currentUser ? "Signed in" : "Get started"}
            </span>
          </div>

          <div className="form-heading">
            <p className="eyebrow form-eyebrow">
              {currentUser
                ? "SESSION ACTIVE"
                : isSignup
                  ? "CREATE YOUR PROFILE"
                  : "WELCOME BACK"}
            </p>
            <h2>
              {currentUser
                ? `Welcome, ${currentUser.firstName}`
                : isSignup
                  ? "Create an account"
                  : "Sign in"}
            </h2>
            <p>
              {currentUser
                ? "Your browser is signed in to this account."
                : isSignup
                  ? "Enter your details to get started."
                  : "Use your email or mobile number to continue."}
            </p>
          </div>

          {currentUser ? (
            <div className="account-panel">
              <div className="account-summary">
                <div className="account-row">
                  <span>NAME</span>
                  <strong>{currentUser.firstName} {currentUser.lastName}</strong>
                </div>
                <div className="account-row">
                  <span>EMAIL</span>
                  <strong>{currentUser.email}</strong>
                </div>
                <div className="account-row">
                  <span>MOBILE</span>
                  <strong>{currentUser.mobileNumber}</strong>
                </div>
              </div>

              <button
                className="submit-button"
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleLogout()}
              >
                <span>{isSubmitting ? "Please wait..." : "Sign out"}</span>
                <span className="submit-arrow" aria-hidden="true">→</span>
              </button>

              <p
                className={error ? "form-notice error" : "form-notice"}
                role="status"
                aria-live="polite"
              >
                {error}
              </p>
            </div>
          ) : (
            <>
              <div className="mode-switch" aria-label="Choose account action">
                <button
                  type="button"
                  className={isSignup ? "mode-button" : "mode-button active"}
                  aria-pressed={!isSignup}
                  disabled={isSubmitting}
                  onClick={() => chooseMode("login")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={isSignup ? "mode-button active" : "mode-button"}
                  aria-pressed={isSignup}
                  disabled={isSubmitting}
                  onClick={() => chooseMode("signup")}
                >
                  Create account
                </button>
              </div>

              <form className="auth-form" key={mode} onSubmit={handleSubmit}>
                {isSignup && (
                  <div className="name-row">
                    <label className="field">
                      <span>First name</span>
                      <input
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        placeholder="First name"
                        required
                      />
                    </label>

                    <label className="field">
                      <span>Last name</span>
                      <input
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        placeholder="Last name"
                        required
                      />
                    </label>
                  </div>
                )}

                <label className="field">
                  <span>{isSignup ? "Email address" : "Email or mobile number"}</span>
                  <input
                    name={isSignup ? "email" : "identifier"}
                    type={isSignup ? "email" : "text"}
                    autoComplete={isSignup ? "email" : "username"}
                    placeholder={
                      isSignup
                        ? "you@example.com"
                        : "you@example.com or +country code"
                    }
                    required
                  />
                </label>

                {isSignup && (
                  <label className="field">
                    <span>Mobile number</span>
                    <input
                      name="mobileNumber"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+country code and number"
                      required
                    />
                  </label>
                )}

                <label className="field">
                  <span>Password</span>
                  <input
                    name="password"
                    type="password"
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    placeholder={
                      isSignup ? "At least 12 characters" : "Enter your password"
                    }
                    minLength={isSignup ? 12 : undefined}
                    maxLength={128}
                    required
                  />
                  {isSignup && (
                    <span className="field-hint">Use at least 12 characters.</span>
                  )}
                </label>

                <button
                  className="submit-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <span>
                    {isSubmitting
                      ? "Please wait..."
                      : isSignup
                        ? "Create account"
                        : "Sign in"}
                  </span>
                  <span className="submit-arrow" aria-hidden="true">→</span>
                </button>

                <p
                  className={error ? "form-notice error" : "form-notice"}
                  role="status"
                  aria-live="polite"
                >
                  {error || notice}
                </p>
              </form>

              <p className="form-footer">
                {isSignup
                  ? "Already have an account? Choose Sign in above."
                  : "New here? Choose Create account above."}
              </p>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;