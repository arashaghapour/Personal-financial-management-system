import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("authentication", () => {
  describe("register and login", () => {
    it("should authenticate a registered user and access a protected endpoint", async () => {
      const email = "auth-test@example.com";
      const password = "Password123!";

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email,
          password,
          firstName: "Auth",
          lastName: "Test",
        });

      expect(registerResponse.status).toBe(201);

      const userId = registerResponse.body.user.id;

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email,
          password,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.accessToken).toBeTypeOf("string");

      const accessToken = loginResponse.body.accessToken;

      const protectedResponse = await request(app)
        .get(`/api/auth-test/protected/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(protectedResponse.status).toBe(200);
      expect(protectedResponse.body.userId).toBe(String(userId));

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      expect(user).not.toBeNull();
    });
  });
});