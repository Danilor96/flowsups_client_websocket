/*
  Warnings:

  - You are about to drop the column `last_name` on the `Clients` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Clients` table. All the data in the column will be lost.
  - Added the required column `name_lastname` to the `Clients` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Clients" DROP CONSTRAINT "Clients_contact_method_id_fkey";

-- DropForeignKey
ALTER TABLE "Clients" DROP CONSTRAINT "Clients_gender_id_fkey";

-- DropForeignKey
ALTER TABLE "Clients" DROP CONSTRAINT "Clients_inquiry_type_id_fkey";

-- DropForeignKey
ALTER TABLE "Clients" DROP CONSTRAINT "Clients_seller_id_fkey";

-- AlterTable
ALTER TABLE "Clients" DROP COLUMN "last_name",
DROP COLUMN "name",
ADD COLUMN     "name_lastname" TEXT NOT NULL,
ALTER COLUMN "contact_time" DROP NOT NULL,
ALTER COLUMN "previous_address" DROP NOT NULL,
ALTER COLUMN "mailing_address" DROP NOT NULL,
ALTER COLUMN "current_job" DROP NOT NULL,
ALTER COLUMN "previous_job" DROP NOT NULL,
ALTER COLUMN "other_income" DROP NOT NULL,
ALTER COLUMN "reference" DROP NOT NULL,
ALTER COLUMN "referrer" DROP NOT NULL,
ALTER COLUMN "cash_down" DROP NOT NULL,
ALTER COLUMN "duplicate" DROP NOT NULL,
ALTER COLUMN "contact_method_id" DROP NOT NULL,
ALTER COLUMN "inquiry_type_id" DROP NOT NULL,
ALTER COLUMN "gender_id" DROP NOT NULL,
ALTER COLUMN "seller_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_contact_method_id_fkey" FOREIGN KEY ("contact_method_id") REFERENCES "Contact_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_inquiry_type_id_fkey" FOREIGN KEY ("inquiry_type_id") REFERENCES "Inquiry_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "Genders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
