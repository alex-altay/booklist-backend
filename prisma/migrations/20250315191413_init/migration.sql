-- CreateEnum
CREATE TYPE "Language" AS ENUM ('RU', 'EN', 'DE');

-- CreateEnum
CREATE TYPE "Rating" AS ENUM ('WORST', 'VERY_BAD', 'BAD', 'BELOW_AVERAGE', 'AVERAGE', 'ABOVE_AVERAGE', 'WORTH_READING', 'GOOD', 'EXCELLENT', 'BEST');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('NON_FICTION', 'SCIENCE', 'POETRY', 'TECHNICAL', 'PHILOSOPHY', 'FICTION');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "resetToken" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "language" "Language" NOT NULL DEFAULT 'RU',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "hasFinished" BOOLEAN DEFAULT false,
    "description" TEXT,
    "rating" "Rating",
    "category" "Category",
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
