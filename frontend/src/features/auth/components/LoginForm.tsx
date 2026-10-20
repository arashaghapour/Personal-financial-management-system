import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";

import { useAuth } from "../auth-context";

import { getAuthErrorMessage } from "../api/error-messages";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schemas";

type LocationState = {
  from?: { pathname?: string; search?: string; hash?: string };
};

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await login(values);

      const from = (location.state as LocationState | null)?.from;

      const destination = from?.pathname
        ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
        : "/dashboard";

      navigate(destination, { replace: true });
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error));
    }
  });

  return (
    <form
      className="auth-form"
      onSubmit={onSubmit}
      noValidate
      aria-busy={isSubmitting}
    >
      {submitError ? (
        <ErrorState title="Sign in failed" message={submitError} />
      ) : null}

      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          aria-required="true"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...field("email", {
            onChange: () => setSubmitError(null),
          })}
        />
        {errors.email ? (
          <p id="email-error" className="form-field-error" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="password">Password</label>
        <div className="password-input-wrap">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-required="true"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...field("password", {
              onChange: () => setSubmitError(null),
            })}
          />
          <button
            type="button"
            className="password-toggle"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-controls="password"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? (
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
        {errors.password ? (
          <p id="password-error" className="form-field-error" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="auth-submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="btn-spinner" aria-hidden="true" />
            <span>Signing in…</span>
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
