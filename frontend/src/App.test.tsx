import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";

describe("App", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render the application", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Get started",
      })
    ).toBeInTheDocument();
  });

  it("should increment the counter when the button is clicked", async () => {
    const user = userEvent.setup();

    render(<App />);

    const button = screen.getByRole("button", {
      name: "Count is 0",
    });

    expect(button).toBeInTheDocument();

    await user.click(button);

    expect(
      screen.getByRole("button", {
        name: "Count is 1",
      })
    ).toBeInTheDocument();
  });
});