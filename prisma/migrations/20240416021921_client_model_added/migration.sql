/*
  Warnings:

  - Added the required column `last_name` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `Users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Users_has_codes" DROP CONSTRAINT "Users_has_codes_code_id_fkey";

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "last_name" TEXT NOT NULL,
ALTER COLUMN "name" SET NOT NULL;

-- CreateTable
CREATE TABLE "Lead_types" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Lead_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead_sources" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "Lead_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Iquiery_types" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Iquiery_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact_methods" (
    "id" SERIAL NOT NULL,
    "method" TEXT NOT NULL,

    CONSTRAINT "Contact_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Languages" (
    "id" SERIAL NOT NULL,
    "language" TEXT NOT NULL,

    CONSTRAINT "Languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clients_has_languages" (
    "id" SERIAL NOT NULL,
    "language_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,

    CONSTRAINT "Clients_has_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Files" (
    "id" SERIAL NOT NULL,
    "file" TEXT NOT NULL,

    CONSTRAINT "Files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clients_has_files" (
    "id" SERIAL NOT NULL,
    "file_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,

    CONSTRAINT "Clients_has_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry_types" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Inquiry_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clients" (
    "id" SERIAL NOT NULL,
    "contact_time" TIMESTAMP(3) NOT NULL,
    "current_address" TEXT NOT NULL,
    "previous_address" TEXT NOT NULL,
    "mailing_address" TEXT NOT NULL,
    "current_job" TEXT NOT NULL,
    "previous_job" TEXT NOT NULL,
    "other_income" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "referrer" TEXT NOT NULL,
    "cash_down" TEXT NOT NULL,
    "duplicate" TEXT NOT NULL,
    "contact_method_id" INTEGER NOT NULL,
    "lead_source_id" INTEGER NOT NULL,
    "lead_type_id" INTEGER NOT NULL,
    "inquiry_type_id" INTEGER NOT NULL,

    CONSTRAINT "Clients_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Users_has_codes" ADD CONSTRAINT "Users_has_codes_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "Activation_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients_has_languages" ADD CONSTRAINT "Clients_has_languages_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "Languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients_has_languages" ADD CONSTRAINT "Clients_has_languages_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients_has_files" ADD CONSTRAINT "Clients_has_files_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "Files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients_has_files" ADD CONSTRAINT "Clients_has_files_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_contact_method_id_fkey" FOREIGN KEY ("contact_method_id") REFERENCES "Contact_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_lead_source_id_fkey" FOREIGN KEY ("lead_source_id") REFERENCES "Lead_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_lead_type_id_fkey" FOREIGN KEY ("lead_type_id") REFERENCES "Lead_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_inquiry_type_id_fkey" FOREIGN KEY ("inquiry_type_id") REFERENCES "Inquiry_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
