import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";

import app from "../../src/app.js";

const validAccount = {
  name: "Main Bank",
  type: "BANK",
  initialBalance: 100000,
};

let accessToken: string;

beforeEach(async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: "account-validation@example.com",
      password: "Password123!",
      firstName: "Test",
      lastName: "User",
    });

  expect(response.status).toBe(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email: "account-validation@example.com",
      password: "Password123!",
    });

  expect(loginResponse.status).toBe(200);

  accessToken = loginResponse.body.accessToken;
});

describe("Account validation", () => {
  describe("POST /api/accounts", () => {
    it("should reject missing name", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          type: validAccount.type,
          initialBalance: validAccount.initialBalance,
        });

      expect(response.status).toBe(400);
    });

    it("should reject empty name", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          ...validAccount,
          name: "",
        });

      expect(response.status).toBe(400);
    });

    it("should reject whitespace-only name", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          ...validAccount,
          name: "   ",
        });

      expect(response.status).toBe(400);
    });

    it("should reject name longer than 100 characters", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          ...validAccount,
          name: "a".repeat(101),
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid account type", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          ...validAccount,
          type: "INVALID",
        });

      expect(response.status).toBe(400);
    });

    it("should reject negative initialBalance", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          ...validAccount,
          initialBalance: -1,
        });

      expect(response.status).toBe(400);
    });

    it("should reject userId in request body", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          ...validAccount,
          userId: 999,
        });

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/accounts/:id", () => {
    it("should reject empty update body", async () => {
      const createResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(validAccount);

      expect(createResponse.status).toBe(201);

      const accountId = createResponse.body.id;

      const response = await request(app)
        .patch(`/api/accounts/${accountId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should reject balance in update body", async () => {
      const createResponse = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(validAccount);

      expect(createResponse.status).toBe(201);

      const accountId = createResponse.body.id;

      const response = await request(app)
        .patch(`/api/accounts/${accountId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          balance: 500000,
        });

      expect(response.status).toBe(400);
    });
  });
});