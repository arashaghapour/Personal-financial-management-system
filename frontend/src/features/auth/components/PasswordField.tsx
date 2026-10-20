import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete: string;
  error?: string;
  registration: UseFormRegisterReturn;
  visibilityLabel: string;
};

export function PasswordField({
  id,
  label,
  autoComplete,
  error,
  registration,
  visibilityLabel,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...registration}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={`${visible ? "Hide" : "Show"} ${visibilityLabel}`}
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <svg
              aria-hidden="true"
              focusable="false"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3l18 18" />
              <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a17.6 17.6 0 0 1-3 3.7" />
              <path d="M6.6 6.6A17.7 17.7 0 0 0 2 12s3.5 6 10 6c1.5 0 2.9-.3 4.1-.8" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              focusable="false"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="form-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
