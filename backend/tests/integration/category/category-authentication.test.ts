import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../../src/app.js";

describe("Category authentication", () => {
  it("should reject create category without authentication", async () => {
    const response = await request(app)
      .post("/api/categories")
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject create category with an invalid token", async () => {
    const response = await request(app)
      .post("/api/categories")
      .set("Authorization", "Bearer invalid-token")
      .send({
        name: "Food",
        type: "EXPENSE",
      });

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });

  it("should reject list categories without authentication", async () => {
    const response = await request(app)
      .get("/api/categories");

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject list categories with an invalid token", async () => {
    const response = await request(app)
      .get("/api/categories")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });

  it("should reject get category without authentication", async () => {
    const response = await request(app)
      .get("/api/categories/00000000-0000-0000-0000-000000000000");

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject get category with an invalid token", async () => {
    const response = await request(app)
      .get("/api/categories/00000000-0000-0000-0000-000000000000")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });

  it("should reject update category without authentication", async () => {
    const response = await request(app)
      .patch("/api/categories/00000000-0000-0000-0000-000000000000")
      .send({
        name: "Food",
      });

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject update category with an invalid token", async () => {
    const response = await request(app)
      .patch("/api/categories/00000000-0000-0000-0000-000000000000")
      .set("Authorization", "Bearer invalid-token")
      .send({
        name: "Food",
      });

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });

  it("should reject delete category without authentication", async () => {
    const response = await request(app)
      .delete("/api/categories/00000000-0000-0000-0000-000000000000");

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject delete category with an invalid token", async () => {
    const response = await request(app)
      .delete("/api/categories/00000000-0000-0000-0000-000000000000")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});