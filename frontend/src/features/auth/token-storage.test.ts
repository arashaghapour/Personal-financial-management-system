import { describe, expect, it } from "vitest";

import { tokenStorage } from "./token-storage";

describe("tokenStorage", () => {
  it("stores and reads both tokens", () => {
    tokenStorage.setTokens("access-token", "refresh-token");

    expect(tokenStorage.getAccessToken()).toBe("access-token");
    expect(tokenStorage.getRefreshToken()).toBe("refresh-token");
  });

  it("clears both tokens", () => {
    tokenStorage.setTokens("access-token", "refresh-token");

    tokenStorage.clear();

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("returns null when no tokens are stored", () => {
    tokenStorage.clear();

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });
});
