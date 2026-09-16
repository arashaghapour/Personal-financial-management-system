import { describe, expect, it } from "vitest";
import { PASSWORD_MIN_LENGTH } from "../../src/modules/auth/auth.constants.js";

describe("Password policy", () => {
  it("should define the minimum password length as 8", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });
});