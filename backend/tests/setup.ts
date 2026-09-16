import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",
});

const { prisma } = await import("../src/lib/prisma.js");

import { beforeEach, afterAll } from "vitest";

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});