import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import {
  authenticated,
  loadingAuth,
  renderWithAuth,
} from "../test/auth-mock";

function LoginLocationProbe() {
  const location = useLocation();
  const from = (
    location.state as {
      from?: { pathname?: string; search?: string; hash?: string };
    } | null
  )?.from;

  return (
    <div>
      <span data-testid="path">
        {location.pathname}
        {location.search}
      </span>
      <span data-testid="from">
        {from?.pathname}
        {from?.search}
        {from?.hash}
      </span>
    </div>
  );
}

const renderProtectedRoute = (
  initialEntry: string,
  auth: Parameters<typeof renderWithAuth>[1] = {},
) =>
  renderWithAuth(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <p>Protected content</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginLocationProbe />} />
      </Routes>
    </MemoryRouter>,
    auth,
  );

describe("ProtectedRoute", () => {
  it("renders a loading indicator while the session is restored", () => {
    renderProtectedRoute("/reports", loadingAuth());

    expect(screen.getByRole("status")).toHaveTextContent(
      "Restoring your session…",
    );
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to /login", () => {
    renderProtectedRoute("/reports", { status: "unauthenticated" });

    expect(screen.getByTestId("path")).toHaveTextContent("/login");
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("preserves the intended destination for login", () => {
    renderProtectedRoute("/reports?month=10#summary", {
      status: "unauthenticated",
    });

    expect(screen.getByTestId("from")).toHaveTextContent(
      "/reports?month=10#summary",
    );
  });

  it("renders its children for authenticated users", () => {
    renderProtectedRoute("/reports", authenticated());

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
