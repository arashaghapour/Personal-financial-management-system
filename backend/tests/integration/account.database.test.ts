import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";

import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("Account database", () => {
  let accessToken: string;
  let userId: number;

  beforeEach(async () => {
    await prisma.user.deleteMany();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "account-database@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

    expect(registerResponse.status).toBe(201);

    userId = registerResponse.body.user.id;

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "account-database@example.com",
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    accessToken = loginResponse.body.accessToken;
  });

  describe("Account table", () => {
    it("should persist an account in the database", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 1000000,
        });

      expect(response.status).toBe(201);

      const account = await prisma.account.findUnique({
        where: {
          id: response.body.id,
        },
      });

      expect(account).not.toBeNull();
      expect(account?.name).toBe("Main Bank");
      expect(account?.type).toBe("BANK");
    });
  });

  describe("Account → User relation", () => {
    it("should persist a valid user relation", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
        });

      expect(response.status).toBe(201);

      const account = await prisma.account.findUnique({
        where: {
          id: response.body.id,
        },
        include: {
          user: true,
        },
      });

      expect(account).not.toBeNull();
      expect(account?.userId).toBe(userId);
      expect(account?.user.id).toBe(userId);
    });
  });

  describe("ID generation", () => {
    it("should generate an account id", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toEqual(expect.any(Number));
      expect(response.body.id).toBeGreaterThan(0);
    });
  });

  describe("balance persistence", () => {
    it("should persist the initial balance", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
          initialBalance: 2500000,
        });

      expect(response.status).toBe(201);

      const account = await prisma.account.findUnique({
        where: {
          id: response.body.id,
        },
      });

      expect(account).not.toBeNull();
      expect(Number(account?.balance)).toBe(2500000);
    });
  });

  describe("userId persistence", () => {
    it("should persist the authenticated user's id", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Cash",
          type: "CASH",
        });

      expect(response.status).toBe(201);

      const account = await prisma.account.findUnique({
        where: {
          id: response.body.id,
        },
      });

      expect(account?.userId).toBe(userId);
    });
  });

  describe("timestamps", () => {
    it("should persist createdAt and updatedAt", async () => {
      const response = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Main Bank",
          type: "BANK",
        });

      expect(response.status).toBe(201);

      const account = await prisma.account.findUnique({
        where: {
          id: response.body.id,
        },
      });

      expect(account).not.toBeNull();
      expect(account?.createdAt).toBeInstanceOf(Date);
      expect(account?.updatedAt).toBeInstanceOf(Date);
    });
  });
});
