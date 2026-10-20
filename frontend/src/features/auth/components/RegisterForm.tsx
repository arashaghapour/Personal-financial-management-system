import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { PasswordField } from "./PasswordField";

import { useAuth } from "../auth-context";

import { getAuthErrorMessage } from "../api/error-messages";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/auth.schemas";

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      // The password confirmation is frontend-only and is never sent to the
      // backend.
      await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });

      navigate("/login", {
        state: { notice: "Account created. Please sign in." },
      });
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
        <ErrorState title="Registration failed" message={submitError} />
      ) : null}

      <div className="auth-name-grid">
        <div className="form-field">
          <label htmlFor="firstName">First name</label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            autoCapitalize="words"
            aria-required="true"
            aria-invalid={errors.firstName ? true : undefined}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
            {...field("firstName", {
              onChange: () => setSubmitError(null),
            })}
          />
          {errors.firstName ? (
            <p id="firstName-error" className="form-field-error" role="alert">
              {errors.firstName.message}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="lastName">Last name</label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            autoCapitalize="words"
            aria-required="true"
            aria-invalid={errors.lastName ? true : undefined}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
            {...field("lastName", {
              onChange: () => setSubmitError(null),
            })}
          />
          {errors.lastName ? (
            <p id="lastName-error" className="form-field-error" role="alert">
              {errors.lastName.message}
            </p>
          ) : null}
        </div>
      </div>

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

      <PasswordField
        id="password"
        label="Password"
        autoComplete="new-password"
        visibilityLabel="password"
        error={errors.password?.message}
        registration={field("password", {
          onChange: () => setSubmitError(null),
        })}
      />

      <PasswordField
        id="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        visibilityLabel="confirm password"
        error={errors.confirmPassword?.message}
        registration={field("confirmPassword", {
          onChange: () => setSubmitError(null),
        })}
      />

      <Button
        type="submit"
        className="auth-submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="btn-spinner" aria-hidden="true" />
            <span>Creating account…</span>
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
