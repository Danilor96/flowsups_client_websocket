/*
  Warnings:

  - Added the required column `first_name` to the `Clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `Clients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Clients" ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "middle_initials" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "salutation" TEXT,
ADD COLUMN     "suffix" TEXT,
ALTER COLUMN "name_lastname" DROP NOT NULL;
