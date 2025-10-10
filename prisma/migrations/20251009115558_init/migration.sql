-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('REGISTRATION', 'AUTHENTICATION');

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

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassKey" (
    "id" TEXT NOT NULL,
    "credentialId" BYTEA NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL,
    "transports" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "userHandle" BYTEA,
    "fmt" TEXT NOT NULL,
    "aaguid" TEXT NOT NULL,

    CONSTRAINT "PassKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebAuthnChallenge" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "userId" INTEGER,
    "challenge" TEXT NOT NULL,
    "isConsumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebAuthnChallenge_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "PassKey_credentialId_key" ON "PassKey"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "WebAuthnChallenge_requestId_key" ON "WebAuthnChallenge"("requestId");

-- CreateIndex
CREATE INDEX "WebAuthnChallenge_expiresAt_idx" ON "WebAuthnChallenge"("expiresAt");

-- AddForeignKey
ALTER TABLE "PassKey" ADD CONSTRAINT "PassKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebAuthnChallenge" ADD CONSTRAINT "WebAuthnChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
