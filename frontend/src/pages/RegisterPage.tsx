import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { RegisterForm } from "../features/auth/components/RegisterForm";

import "../styles/ui.css";

type Feature = {
  label: string;
  icon: ReactNode;
};

const FEATURES: Feature[] = [
  {
    label: "Set up in under a minute",
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
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    label: "Private by default",
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
  {
    label: "No spreadsheets required",
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
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
];

const SETUP_STEPS = [
  "Create your account",
  "Add your first account",
  "Set a monthly budget",
];

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <aside
        className="auth-brand"
        aria-label="Getting started with Finance Manager"
      >
        <div className="auth-brand-inner">
          <div className="auth-logo">
            <span className="auth-logo-mark" aria-hidden="true">
              $
            </span>
            <span className="auth-logo-text">Finance Manager</span>
          </div>

          <div className="auth-brand-copy">
            <p className="auth-eyebrow">Personal finance, simplified</p>
            <p className="auth-headline">A clearer view starts here.</p>
            <p className="auth-lead">
              Create your account and bring your accounts, budgets, and goals
              into one calm place.
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
            <div className="auth-visual-card">
              <div className="auth-visual-header">
                <span className="auth-visual-title">Getting started</span>
                <span className="auth-visual-badge">3 steps</span>
              </div>
              <ol className="auth-setup-list">
                {SETUP_STEPS.map((step, index) => (
                  <li key={step} className="auth-setup-step">
                    <span className="auth-setup-number" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="auth-setup-note">
                You can update everything later.
              </p>
            </div>
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
            <p className="auth-eyebrow auth-eyebrow--card">Get started</p>
            <h1>Create account</h1>
            <p className="auth-subtitle">
              Start tracking your personal finances in minutes.
            </p>
          </div>

          <RegisterForm />

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
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
