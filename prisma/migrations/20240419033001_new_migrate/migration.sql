/*
  Warnings:

  - You are about to drop the column `from_time` on the `Appointments` table. All the data in the column will be lost.
  - You are about to drop the column `to_time` on the `Appointments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Appointments" DROP COLUMN "from_time",
DROP COLUMN "to_time";
