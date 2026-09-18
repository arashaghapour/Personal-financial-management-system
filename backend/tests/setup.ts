import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",
  override: true,
});

const { prisma } = await import("../src/lib/prisma.js");

import { beforeEach, afterAll } from "vitest";

beforeEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});