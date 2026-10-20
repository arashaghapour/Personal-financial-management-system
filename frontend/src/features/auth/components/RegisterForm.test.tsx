import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";

import { RegisterForm } from "./RegisterForm";

import { renderWithAuth } from "../../../test/auth-mock";
import { ApiError } from "../../../lib/api/client";

function LocationDisplay() {
  const location = useLocation();

  return <span data-testid="location">{location.pathname}</span>;
}

const renderForm = (register = vi.fn().mockResolvedValue(undefined)) => ({
  register,
  ...renderWithAuth(
    <MemoryRouter>
      <RegisterForm />
      <LocationDisplay />
    </MemoryRouter>,
    { register },
  ),
});

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("First name"), "Arash");
  await user.type(screen.getByLabelText("Last name"), "Aghapour");
  await user.type(screen.getByLabelText("Email"), "user@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm password"), "password123");
};

describe("RegisterForm", () => {
  it("renders all registration fields", () => {
    renderForm();

    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
  });

  it("toggles each password field with an accessible control", async () => {
    const user = userEvent.setup();

    renderForm();

    const password = screen.getByLabelText("Password");
    const confirmPassword = screen.getByLabelText("Confirm password");

    expect(password).toHaveAttribute("type", "password");
    expect(confirmPassword).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(password).toHaveAttribute("type", "text");
    expect(confirmPassword).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", { name: "Show confirm password" }),
    );

    expect(confirmPassword).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));

    expect(password).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", { name: "Hide confirm password" }),
    );

    expect(confirmPassword).toHaveAttribute("type", "password");
  });

  it("shows validation errors for missing required fields", async () => {
    const user = userEvent.setup();
    const { register } = renderForm();

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("First name is required"),
    ).toBeInTheDocument();
    expect(screen.getByText("Last name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(
      screen.getByText("Please confirm your password"),
    ).toBeInTheDocument();

    expect(register).not.toHaveBeenCalled();
  });

  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    const { register } = renderForm();

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();

    expect(register).not.toHaveBeenCalled();
  });

  it("shows a validation error for a short password", async () => {
    const user = userEvent.setup();
    const { register } = renderForm();

    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();

    expect(register).not.toHaveBeenCalled();
  });

  it("shows a validation error when the passwords do not match", async () => {
    const user = userEvent.setup();
    const { register } = renderForm();

    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "different");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();

    expect(register).not.toHaveBeenCalled();
  });

  it("submits without the password confirmation and navigates to /login", async () => {
    const user = userEvent.setup();
    const { register } = renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        firstName: "Arash",
        lastName: "Aghapour",
        email: "user@example.com",
        password: "password123",
      }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/login"),
    );
  });

  it("shows the duplicate email error from the backend", async () => {
    const user = userEvent.setup();
    const register = vi
      .fn()
      .mockRejectedValue(
        new ApiError(409, "Email already exists", "EMAIL_ALREADY_EXISTS"),
      );

    renderForm(register);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("An account with this email already exists."),
    ).toBeInTheDocument();
  });

  it("prevents duplicate submissions while the request is pending", async () => {
    const user = userEvent.setup();
    const register = vi.fn(() => new Promise(() => {}));

    renderForm(register);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    const submitButton = screen.getByRole("button", {
      name: "Creating account…",
    });

    expect(submitButton).toBeDisabled();

    await user.click(submitButton).catch(() => {});

    expect(register).toHaveBeenCalledTimes(1);
  });
});
