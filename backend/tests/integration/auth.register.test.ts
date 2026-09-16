import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("POST /api/auth/register", () => {
  it("should create a user and return 201", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "user@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });

    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty("user");

    expect(response.body.user).toMatchObject({
      email: "user@example.com",
      firstName: "Arash",
      lastName: "Aghapour",
    });
    const user = await prisma.user.findUnique({
      where: {
        email: "user@example.com",
      },
    });

    expect(user).not.toBeNull();
  });

  it("should not expose password or passwordHash", async () => {
  const response = await request(app)
      .post("/api/auth/register")
      .send({
      email: "user@example.com",
      password: "password123",
      firstName: "Arash",
      lastName: "Aghapour",
      });

  expect(response.status).toBe(201);

  expect(response.body.user).not.toHaveProperty("password");
  expect(response.body.user).not.toHaveProperty("passwordHash");
  });


  it("should normalize the email before storing it", async () => {
  const response = await request(app)
      .post("/api/auth/register")
      .send({
      email: "  User@Example.COM  ",
      password: "password123",
      firstName: "Arash",
      lastName: "Aghapour",
      });  
  expect(response.status).toBe(201);
  expect(response.body.user.email).toBe("user@example.com");  
  const user = await prisma.user.findUnique({
      where: {
      email: "user@example.com",
      },
  });

    expect(user).not.toBeNull();
    });



  it("should return 409 when email already exists", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "user@example.com",
        password: "password123",
        firstName: "Arash",
        lastName: "Aghapour",
      });
  
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "user@example.com",
        password: "anotherpassword",
        firstName: "Other",
        lastName: "User",
      });
  
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });


  it("should store a password hash instead of plaintext", async () => {
    const password = "password123";
  
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "user@example.com",
        password,
        firstName: "Arash",
        lastName: "Aghapour",
      });
  
    const user = await prisma.user.findUnique({
      where: {
        email: "user@example.com",
      },
    });
  
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBe(password);
    expect(user!.passwordHash).toMatch(/^\$argon2id\$/);
  });


});