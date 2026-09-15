import { describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";

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

  it("uses the test database", async () => {
    const result = await prisma.$queryRaw<
      { current_database: string }[]
    >`SELECT current_database()`;

    expect(result[0].current_database).toBe("finance_test_db");
  });
  it("can query the user table", async () => {
    const users = await prisma.user.findMany();

    expect(users).toEqual([]);
  });

});