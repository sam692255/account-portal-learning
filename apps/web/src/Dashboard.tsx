import { useEffect, useState } from "react";
import "./Dashboard.css";

type DashboardProps = {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onSignOut: () => void;
  isSigningOut: boolean;
  signOutError: string;
};

const startingActivity = [32, 45, 39, 56, 48, 70, 61, 77, 64, 85, 72, 90];

export default function Dashboard({
  user,
  onSignOut,
  isSigningOut,
  signOutError,
}: DashboardProps) {
  const [activity, setActivity] = useState(startingActivity);
  const [updates, setUpdates] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActivity((previous) => {
        const lastValue = previous[previous.length - 1] ?? 50;
        const change = Math.round((Math.random() - 0.5) * 18);
        const nextValue = Math.max(18, Math.min(96, lastValue + change));
        return [...previous.slice(1), nextValue];
      });

      setUpdates((previous) => previous + 1);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  const points = activity.map((value, index) => ({
    x: (index / (activity.length - 1)) * 720,
    y: 190 - value * 1.5,
  }));

  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const currentPoint = points[points.length - 1] ?? { x: 720, y: 100 };
  const activeVisitors = activity[activity.length - 1] ?? 0;
  const pageViews = (1240 + updates * 3).toLocaleString();

  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <div className="dashboard-brand">
          <span className="dashboard-brand-mark">A</span>
          <span>ACCOUNT PORTAL</span>
        </div>
        <div className="dashboard-user">
          <span className="dashboard-avatar">{user.firstName[0]}</span>
          <span>{user.firstName} {user.lastName}</span>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <p className="dashboard-side-label">WORKSPACE</p>
          <div className="dashboard-nav-active">◈ &nbsp; Overview</div>
          <p className="dashboard-side-note">More sections can be added later.</p>
        </aside>

        <section className="dashboard-content">
          <div className="dashboard-heading">
            <div>
              <p className="dashboard-eyebrow">YOUR ACCOUNT, IN ONE PLACE</p>
              <h1>Welcome, {user.firstName}</h1>
              <p className="dashboard-subtitle">
                Here is a live preview of your dashboard.
              </p>
            </div>
            <button
              className="dashboard-signout"
              type="button"
              disabled={isSigningOut}
              onClick={onSignOut}
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </div>

          {signOutError && (
            <p className="dashboard-error" role="alert">{signOutError}</p>
          )}

          <div className="dashboard-demo-notice">
            DEMO DATA · These sample values are not connected to real analytics.
          </div>

          <div className="dashboard-stats">
            <article className="dashboard-stat">
              <span>VISITORS ONLINE</span>
              <strong>{activeVisitors}</strong>
              <small>Sample value, updates every 3 seconds</small>
            </article>
            <article className="dashboard-stat">
              <span>PAGE VIEWS TODAY</span>
              <strong>{pageViews}</strong>
              <small>Simulated counter</small>
            </article>
            <article className="dashboard-stat">
              <span>AVERAGE SESSION</span>
              <strong>3m 42s</strong>
              <small>Example metric</small>
            </article>
            <article className="dashboard-stat">
              <span>RETURNING VISITORS</span>
              <strong>38%</strong>
              <small>Example metric</small>
            </article>
          </div>

          <div className="dashboard-panels">
            <article className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <h2>Activity overview</h2>
                  <p>Simulated activity changing every few seconds</p>
                </div>
                <span className="dashboard-live"><i /> LIVE DEMO</span>
              </div>

              <svg
                className="dashboard-chart"
                viewBox="0 0 720 220"
                role="img"
                aria-label="A demo activity line chart that updates every three seconds"
                preserveAspectRatio="none"
              >
                {[35, 80, 125, 170].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="720"
                    y2={y}
                    className="dashboard-chart-grid"
                  />
                ))}
                <polyline
                  points={linePoints}
                  className="dashboard-chart-line"
                />
                <circle
                  cx={currentPoint.x}
                  cy={currentPoint.y}
                  r="6"
                  className="dashboard-chart-dot"
                />
              </svg>

              <div className="dashboard-chart-labels">
                <span>08:00</span>
                <span>10:00</span>
                <span>12:00</span>
                <span>Now</span>
              </div>
            </article>

            <article className="dashboard-panel dashboard-activity">
              <h2>Recent demo activity</h2>
              <p>Example events for the dashboard preview.</p>
              <div className="dashboard-event">
                <span className="dashboard-event-dot" />
                <div><strong>Sample visitors updated</strong><small>Just now</small></div>
              </div>
              <div className="dashboard-event">
                <span className="dashboard-event-dot" />
                <div><strong>Demo chart refreshed</strong><small>Every 3 seconds</small></div>
              </div>
              <div className="dashboard-event">
                <span className="dashboard-event-dot" />
                <div><strong>Signed in as {user.email}</strong><small>Your account session</small></div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}