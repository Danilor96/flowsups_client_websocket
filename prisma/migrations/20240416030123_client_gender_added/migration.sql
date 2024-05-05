/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Clients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `born_date` to the `Clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender_id` to the `Clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `home_phone` to the `Clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `Clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobile_phone` to the `Clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seller_id` to the `Clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `social_security` to the `Clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `work_phone` to the `Clients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Clients" ADD COLUMN     "born_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "gender_id" INTEGER NOT NULL,
ADD COLUMN     "home_phone" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "mobile_phone" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "seller_id" INTEGER NOT NULL,
ADD COLUMN     "social_security" TEXT NOT NULL,
ADD COLUMN     "work_phone" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Genders" (
    "id" SERIAL NOT NULL,
    "gender" TEXT NOT NULL,

    CONSTRAINT "Genders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clients_email_key" ON "Clients"("email");

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "Genders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
