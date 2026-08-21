/*
  Warnings:

  - You are about to drop the column `hasFinished` on the `Book` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DROPPED', 'FINISHED');

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "hasFinished",
ADD COLUMN     "status" "Status";
