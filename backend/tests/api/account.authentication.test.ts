import { describe, expect, it } from "vitest";

import request from "supertest";

import app from "../../src/app.js";

const accountId = 1;

const endpoints = [
  {
    method: "get",
    path: "/api/accounts",
  },
  {
    method: "post",
    path: "/api/accounts",
  },
  {
    method: "get",
    path: `/api/accounts/${accountId}`,
  },
  {
    method: "patch",
    path: `/api/accounts/${accountId}`,
  },
  {
    method: "delete",
    path: `/api/accounts/${accountId}`,
  },
] as const;

const sendRequest = (
  method: (typeof endpoints)[number]["method"],
  path: string,
) => {
  switch (method) {
    case "get":
      return request(app).get(path);
    case "post":
      return request(app).post(path);
    case "patch":
      return request(app).patch(path);
    case "delete":
      return request(app).delete(path);
  }
};

describe("Account authentication", () => {
  describe("without access token", () => {
    it.each(endpoints)(
      "$method $path should return 401",
      async ({ method, path }) => {
        const response = await sendRequest(method, path);

        expect(response.status).toBe(401);
      },
    );
  });

  describe("with invalid access token", () => {
    it.each(endpoints)(
      "$method $path should return 401",
      async ({ method, path }) => {
        const response = await sendRequest(method, path)
          .set("Authorization", "Bearer invalid-access-token");

        expect(response.status).toBe(401);
      },
    );
  });
});