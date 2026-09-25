import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("Test Resource Authorization", () => {
  it("should allow the owner to create a resource", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "owner@example.com",
        password: "password123",
        firstName: "Owner",
        lastName: "User",
      });

    const userId = registerResponse.body.user.id;

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "owner@example.com",
        password: "password123",
      });

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .post("/api/test-resources")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Resource A",
      });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      userId,
      name: "Resource A",
    });
  });

  it("should not allow another user to read the resource", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "user-a@example.com",
        password: "password123",
        firstName: "User",
        lastName: "A",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "user-b@example.com",
        password: "password123",
        firstName: "User",
        lastName: "B",
      });

    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: "user-a@example.com",
        password: "password123",
      });

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: "user-b@example.com",
        password: "password123",
      });

    const tokenA = loginA.body.accessToken;
    const tokenB = loginB.body.accessToken;

    const createResponse = await request(app)
      .post("/api/test-resources")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Resource A",
      });

    const resourceId = createResponse.body.id;

    const ownerResponse = await request(app)
      .get(`/api/test-resources/${resourceId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    console.log(ownerResponse.body);
    expect(ownerResponse.status).toBe(200);

    const otherUserResponse = await request(app)
      .get(`/api/test-resources/${resourceId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(otherUserResponse.status).toBe(404);
  });

  it("should not allow another user to update the resource", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "update-a@example.com",
        password: "password123",
        firstName: "User",
        lastName: "A",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "update-b@example.com",
        password: "password123",
        firstName: "User",
        lastName: "B",
      });

    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: "update-a@example.com",
        password: "password123",
      });

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: "update-b@example.com",
        password: "password123",
      });

    const tokenA = loginA.body.accessToken;
    const tokenB = loginB.body.accessToken;

    const createResponse = await request(app)
      .post("/api/test-resources")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Original Name",
      });

    const resourceId = createResponse.body.id;

    const ownerUpdate = await request(app)
      .patch(`/api/test-resources/${resourceId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Updated By Owner",
      });

    expect(ownerUpdate.status).toBe(200);
    expect(ownerUpdate.body.name).toBe("Updated By Owner");

    const otherUserUpdate = await request(app)
      .patch(`/api/test-resources/${resourceId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Updated By Other User",
      });

    expect(otherUserUpdate.status).toBe(404);

    const resource = await prisma.testResource.findUnique({
      where: {
        id: resourceId,
      },
    });

    expect(resource?.name).toBe("Updated By Owner");
  });

  it("should not allow another user to delete the resource", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "delete-a@example.com",
        password: "password123",
        firstName: "User",
        lastName: "A",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "delete-b@example.com",
        password: "password123",
        firstName: "User",
        lastName: "B",
      });

    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: "delete-a@example.com",
        password: "password123",
      });

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: "delete-b@example.com",
        password: "password123",
      });

    const tokenA = loginA.body.accessToken;
    const tokenB = loginB.body.accessToken;

    const createResponse = await request(app)
      .post("/api/test-resources")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Resource To Delete",
      });

    const resourceId = createResponse.body.id;

    const otherUserDelete = await request(app)
      .delete(`/api/test-resources/${resourceId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(otherUserDelete.status).toBe(404);

    const resourceAfterFailedDelete =
      await prisma.testResource.findUnique({
        where: {
          id: resourceId,
        },
      });

    expect(resourceAfterFailedDelete).not.toBeNull();

    const ownerDelete = await request(app)
      .delete(`/api/test-resources/${resourceId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(ownerDelete.status).toBe(204);

    const deletedResource =
      await prisma.testResource.findUnique({
        where: {
          id: resourceId,
        },
      });

    expect(deletedResource).toBeNull();
  });

  it("should use the authenticated user as the resource owner", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "ownership@example.com",
        password: "password123",
        firstName: "Owner",
        lastName: "User",
      });

    const userId = registerResponse.body.user.id;

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "ownership@example.com",
        password: "password123",
      });

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .post("/api/test-resources")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Owned Resource",
        userId: 999999,
      });

    expect(response.status).toBe(201);

    expect(response.body.userId).toBe(userId);

    const resource = await prisma.testResource.findUnique({
      where: {
        id: response.body.id,
      },
    });

    expect(resource?.userId).toBe(userId);
    expect(resource?.userId).not.toBe(999999);
  });
});

describe("IDOR Protection", () => {
  // GET

  it("should prevent IDOR on GET", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "idor-get-a@example.com",
        password: "password123",
        firstName: "User",
        lastName: "A",
      });
  
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "idor-get-b@example.com",
        password: "password123",
        firstName: "User",
        lastName: "B",
      });
  
    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: "idor-get-a@example.com",
        password: "password123",
      });
  
    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: "idor-get-b@example.com",
        password: "password123",
      });
  
    const tokenA = loginA.body.accessToken;
    const tokenB = loginB.body.accessToken;
  
    const createResponse = await request(app)
      .post("/api/test-resources")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "User A Resource",
      });
  
    const resourceAId = createResponse.body.id;
  
    const response = await request(app)
      .get(`/api/test-resources/${resourceAId}`)
      .set("Authorization", `Bearer ${tokenB}`);
  
    expect(response.status).toBe(404);
  });

  // PATCH

  it("should prevent IDOR on PATCH", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "idor-patch-a@example.com",
        password: "password123",
        firstName: "User",
        lastName: "A",
      });
  
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "idor-patch-b@example.com",
        password: "password123",
        firstName: "User",
        lastName: "B",
      });
  
    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: "idor-patch-a@example.com",
        password: "password123",
      });
  
    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: "idor-patch-b@example.com",
        password: "password123",
      });
  
    const tokenA = loginA.body.accessToken;
    const tokenB = loginB.body.accessToken;
  
    const createResponse = await request(app)
      .post("/api/test-resources")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Original Name",
      });
  
    const resourceAId = createResponse.body.id;
  
    const response = await request(app)
      .patch(`/api/test-resources/${resourceAId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "Hacked Name",
      });
  
    expect(response.status).toBe(404);
  
    const resource = await prisma.testResource.findUnique({
      where: {
        id: resourceAId,
      },
    });
  
    expect(resource?.name).toBe("Original Name");
  });

  // DELETE

  it("should prevent IDOR on DELETE", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "idor-delete-a@example.com",
        password: "password123",
        firstName: "User",
        lastName: "A",
      });
  
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "idor-delete-b@example.com",
        password: "password123",
        firstName: "User",
        lastName: "B",
      });
  
    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: "idor-delete-a@example.com",
        password: "password123",
      });
  
    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: "idor-delete-b@example.com",
        password: "password123",
      });
  
    const tokenA = loginA.body.accessToken;
    const tokenB = loginB.body.accessToken;
  
    const createResponse = await request(app)
      .post("/api/test-resources")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Resource A",
      });
  
    const resourceAId = createResponse.body.id;
  
    const response = await request(app)
      .delete(`/api/test-resources/${resourceAId}`)
      .set("Authorization", `Bearer ${tokenB}`);
  
    expect(response.status).toBe(404);
  
    const resource = await prisma.testResource.findUnique({
      where: {
        id: resourceAId,
      },
    });
  
    expect(resource).not.toBeNull();
  });


});

describe("Error Security", () => {
  it("should return the same error response for a non-existent resource and another user's resource", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "error-security-a@example.com",
        password: "password123",
        firstName: "User",
        lastName: "A",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "error-security-b@example.com",
        password: "password123",
        firstName: "User",
        lastName: "B",
      });

    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: "error-security-a@example.com",
        password: "password123",
      });

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: "error-security-b@example.com",
        password: "password123",
      });

    const tokenA = loginA.body.accessToken;
    const tokenB = loginB.body.accessToken;

    const createResponse = await request(app)
      .post("/api/test-resources")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Private Resource",
      });

    const resourceAId = createResponse.body.id;

    const nonExistentResponse = await request(app)
      .get("/api/test-resources/999999")
      .set("Authorization", `Bearer ${tokenB}`);

    const unauthorizedResponse = await request(app)
      .get(`/api/test-resources/${resourceAId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(nonExistentResponse.status).toBe(404);
    expect(unauthorizedResponse.status).toBe(404);

    expect(unauthorizedResponse.body).toEqual(
      nonExistentResponse.body,
    );
  });

  it("should not expose resource or ownership information on authorization failure", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "exposure-a@example.com",
        password: "password123",
        firstName: "User",
        lastName: "A",
      });

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "exposure-b@example.com",
        password: "password123",
        firstName: "User",
        lastName: "B",
      });

    const loginA = await request(app)
      .post("/api/auth/login")
      .send({
        email: "exposure-a@example.com",
        password: "password123",
      });

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({
        email: "exposure-b@example.com",
        password: "password123",
      });

    const tokenA = loginA.body.accessToken;
    const tokenB = loginB.body.accessToken;

    const createResponse = await request(app)
      .post("/api/test-resources")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Private Resource",
      });

    const resourceAId = createResponse.body.id;

    const response = await request(app)
      .get(`/api/test-resources/${resourceAId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(response.status).toBe(404);

    expect(response.body).not.toHaveProperty("id");
    expect(response.body).not.toHaveProperty("userId");
    expect(response.body).not.toHaveProperty("name");
    expect(response.body).not.toHaveProperty("email");
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("passwordHash");
  });
});