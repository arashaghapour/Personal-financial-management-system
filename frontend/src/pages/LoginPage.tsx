import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

import { LoginForm } from "../features/auth/components/LoginForm";

import "../styles/ui.css";

type LocationState = {
  notice?: string;
};

type Feature = {
  label: string;
  icon: ReactNode;
};

const FEATURES: Feature[] = [
  {
    label: "See every account in one place",
    icon: (
      <svg
        aria-hidden="true"
        focusable="false"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18M16 15h2" />
      </svg>
    ),
  },
  {
    label: "Plan budgets you can actually keep",
    icon: (
      <svg
        aria-hidden="true"
        focusable="false"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19V5m0 14h16" />
        <path d="M8 15l3-4 3 2 4-6" />
      </svg>
    ),
  },
  {
    label: "Understand where your money goes",
    icon: (
      <svg
        aria-hidden="true"
        focusable="false"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

function CashFlowPreview() {
  return (
    <div className="auth-visual-card" aria-hidden="true">
      <div className="auth-visual-header">
        <span className="auth-visual-title">Monthly cash flow</span>
        <span className="auth-visual-badge">Preview</span>
      </div>
      <svg
        className="auth-chart"
        viewBox="0 0 360 132"
        fill="none"
        role="presentation"
        focusable="false"
      >
        <defs>
          <linearGradient id="auth-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="rgba(148, 163, 184, 0.16)" strokeWidth="1">
          <line x1="0" y1="12" x2="360" y2="12" />
          <line x1="0" y1="44" x2="360" y2="44" />
          <line x1="0" y1="76" x2="360" y2="76" />
          <line x1="0" y1="108" x2="360" y2="108" />
        </g>
        <path
          d="M0 96C32 88 48 70 78 74C106 78 122 98 150 90C178 82 190 52 220 56C250 60 266 36 296 40C320 43 340 30 360 24V132H0Z"
          fill="url(#auth-chart-fill)"
        />
        <path
          d="M0 96C32 88 48 70 78 74C106 78 122 98 150 90C178 82 190 52 220 56C250 60 266 36 296 40C320 43 340 30 360 24"
          stroke="#60a5fa"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M0 112C30 108 50 104 78 106C110 108 128 96 154 100C184 104 198 88 226 92C254 96 274 80 300 84C324 88 344 76 360 74"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="5 6"
        />
        <circle
          cx="150"
          cy="90"
          r="4"
          fill="#60a5fa"
          stroke="#0b1220"
          strokeWidth="3"
        />
        <circle
          cx="296"
          cy="40"
          r="4"
          fill="#60a5fa"
          stroke="#0b1220"
          strokeWidth="3"
        />
      </svg>
      <div className="auth-visual-legend">
        <span>
          <span className="auth-legend-dot auth-legend-dot--income" />
          Income
        </span>
        <span>
          <span className="auth-legend-dot auth-legend-dot--spending" />
          Spending
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const location = useLocation();
  const notice = (location.state as LocationState | null)?.notice;

  return (
    <div className="auth-page">
      <aside className="auth-brand" aria-label="About Finance Manager">
        <div className="auth-brand-inner">
          <div className="auth-logo">
            <span className="auth-logo-mark" aria-hidden="true">
              $
            </span>
            <span className="auth-logo-text">Finance Manager</span>
          </div>

          <div className="auth-brand-copy">
            <p className="auth-eyebrow">Personal finance, simplified</p>
            <p className="auth-headline">Your money, in clear view.</p>
            <p className="auth-lead">
              Track spending, plan your month, and make confident decisions with
              one calm place for your finances.
            </p>
          </div>

          <ul className="auth-features">
            {FEATURES.map((feature) => (
              <li key={feature.label} className="auth-feature">
                <span className="auth-feature-icon">{feature.icon}</span>
                <span>{feature.label}</span>
              </li>
            ))}
          </ul>

          <div className="auth-visual">
            <CashFlowPreview />
          </div>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-logo-mark" aria-hidden="true">
              $
            </span>
            <span>Finance Manager</span>
          </div>

          <div className="auth-card-header">
            <p className="auth-eyebrow auth-eyebrow--card">Welcome back</p>
            <h1>Sign in</h1>
            <p className="auth-subtitle">
              Access your accounts, budgets, and reports.
            </p>
          </div>

          {notice ? (
            <p className="auth-notice" role="status">
              <svg
                aria-hidden="true"
                focusable="false"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{notice}</span>
            </p>
          ) : null}

          <LoginForm />

          <p className="auth-switch">
            New to Finance Manager?{" "}
            <Link to="/register">Create an account</Link>
          </p>

          <p className="auth-security">
            <svg
              aria-hidden="true"
              focusable="false"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <span>Secure, token-based authentication</span>
          </p>
        </div>
      </main>
    </div>
  );
}
