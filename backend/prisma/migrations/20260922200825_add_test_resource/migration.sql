-- CreateTable
CREATE TABLE "TestResource" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestResource_userId_idx" ON "TestResource"("userId");

-- AddForeignKey
ALTER TABLE "TestResource" ADD CONSTRAINT "TestResource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
