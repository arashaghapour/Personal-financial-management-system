import { describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";

import { LoginForm } from "./LoginForm";

import { renderWithAuth } from "../../../test/auth-mock";
import { ApiError } from "../../../lib/api/client";

function LocationDisplay() {
  const location = useLocation();

  return (
    <span data-testid="location">
      {location.pathname}
      {location.search}
    </span>
  );
}

const renderForm = (
  login = vi.fn().mockResolvedValue(undefined),
  initialEntries: ComponentProps<typeof MemoryRouter>["initialEntries"] = [
    "/login",
  ],
) => ({
  login,
  ...renderWithAuth(
    <MemoryRouter initialEntries={initialEntries}>
      <LoginForm />
      <LocationDisplay />
    </MemoryRouter>,
    { login },
  ),
});

const fillCredentials = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Email"), "user@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
};

describe("LoginForm", () => {
  it("renders the email and password fields", () => {
    renderForm();

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("toggles password visibility with an accessible control", async () => {
    const user = userEvent.setup();

    renderForm();

    const password = screen.getByLabelText("Password");

    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(password).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Hide password" }));

    expect(password).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("shows validation errors for missing fields", async () => {
    const user = userEvent.setup();
    const { login } = renderForm();

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();

    expect(login).not.toHaveBeenCalled();
  });

  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    const { login } = renderForm();

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();

    expect(login).not.toHaveBeenCalled();
  });

  it("shows a clear error for invalid credentials", async () => {
    const user = userEvent.setup();
    const login = vi
      .fn()
      .mockRejectedValue(
        new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS"),
      );

    renderForm(login);

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Invalid email or password."),
    ).toBeInTheDocument();
  });

  it("shows a generic error for unexpected API failures", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    renderForm(login);

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
  });

  it("submits the credentials and navigates to the dashboard", async () => {
    const user = userEvent.setup();
    const { login } = renderForm();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/dashboard"),
    );
  });

  it("returns to the intended destination after login", async () => {
    const user = userEvent.setup();
    const { login } = renderForm(vi.fn().mockResolvedValue(undefined), [
      {
        pathname: "/login",
        state: { from: { pathname: "/reports", search: "?month=10" } },
      },
    ]);

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(login).toHaveBeenCalled());

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/reports?month=10",
      ),
    );
  });

  it("prevents duplicate submissions while the request is pending", async () => {
    const user = userEvent.setup();
    const login = vi.fn(() => new Promise(() => {}));

    renderForm(login);

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const submitButton = screen.getByRole("button", { name: "Signing in…" });

    expect(submitButton).toBeDisabled();

    await user.click(submitButton).catch(() => {});

    expect(login).toHaveBeenCalledTimes(1);
  });
});
