import { describe, it, expect, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";

import AppLayout from "./AppLayout";

import { authenticated, renderWithAuth } from "../../test/auth-mock";

const PLANNED_SECTIONS = [
  "Dashboard",
  "Accounts",
  "Categories",
  "Transactions",
  "Budgets",
  "Reports",
];

function LocationDisplay() {
  const location = useLocation();

  return <span data-testid="location">{location.pathname}</span>;
}

function renderLayout(
  path = "/dashboard",
  auth: Parameters<typeof renderWithAuth>[1] = {},
) {
  return renderWithAuth(
    <MemoryRouter initialEntries={[path]}>
      <AppLayout />
      <LocationDisplay />
    </MemoryRouter>,
    auth,
  );
}

describe("AppLayout", () => {
  it("renders the application name", () => {
    renderLayout();

    expect(screen.getByText("Finance Manager")).toBeInTheDocument();
  });

  it("renders a navigation with all planned financial sections", () => {
    renderLayout();

    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const section of PLANNED_SECTIONS) {
      expect(
        within(nav).getByRole("link", { name: section }),
      ).toBeInTheDocument();
    }
  });

  it("renders a main content area", () => {
    renderLayout();

    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("toggles the mobile navigation menu", async () => {
    const user = userEvent.setup();
    renderLayout();

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(
      screen.getByRole("button", { name: "Close menu" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the mobile navigation with Escape and restores focus", async () => {
    const user = userEvent.setup();
    renderLayout();

    const toggle = screen.getByRole("button", { name: "Open menu" });
    await user.click(toggle);

    await user.keyboard("{Escape}");

    expect(
      screen.getByRole("button", { name: "Open menu" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("closes the mobile navigation when the backdrop is tapped", async () => {
    const user = userEvent.setup();
    const { container } = renderLayout();

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const backdrop = container.querySelector(".app-nav-backdrop");
    expect(backdrop).not.toBeNull();

    fireEvent.mouseDown(backdrop!);

    expect(
      screen.getByRole("button", { name: "Open menu" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector(".app-nav-backdrop")).toBeNull();
  });

  it("navigates and closes the mobile menu when a link is selected", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const nav = screen.getByRole("navigation", { name: "Primary" });
    await user.click(within(nav).getByRole("link", { name: "Accounts" }));

    expect(
      screen.getByRole("button", { name: "Open menu" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("location")).toHaveTextContent("/accounts");
  });

  it("shows the signed-in user and logs out to the login page", async () => {
    const user = userEvent.setup();
    const logout = vi.fn().mockResolvedValue(undefined);

    renderLayout("/dashboard", { ...authenticated(), logout });

    expect(screen.getByText("Arash Aghapour")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(logout).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/login"),
    );
  });
});
