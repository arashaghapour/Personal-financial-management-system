import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";

describe("database", () => {
  it("connects to the database", async () => {
    await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined();
  });

  it("can query the user table", async () => {
    await expect(
      prisma.user.findMany({
        take: 1,
      })
    ).resolves.toBeDefined();
  });
});