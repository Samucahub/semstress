/*
  Warnings:

  - You are about to drop the column `mentor` on the `Internship` table. All the data in the column will be lost.
  - Added the required column `institute` to the `Internship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Internship" DROP COLUMN "mentor",
ADD COLUMN     "companyMentor" TEXT,
ADD COLUMN     "institute" TEXT NOT NULL,
ADD COLUMN     "instituteMentor" TEXT,
ADD COLUMN     "totalHours" INTEGER;
