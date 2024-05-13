/*
  Warnings:

  - The primary key for the `Clients_has_languages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Clients_has_languages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Clients" ADD COLUMN     "client_messages_id" INTEGER;

-- AlterTable
ALTER TABLE "Clients_has_languages" DROP CONSTRAINT "Clients_has_languages_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Clients_has_languages_pkey" PRIMARY KEY ("client_id", "language_id");

-- CreateTable
CREATE TABLE "Client_sms" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "date_sent" TIMESTAMP(3) NOT NULL,
    "sent_by_user" BOOLEAN NOT NULL,

    CONSTRAINT "Client_sms_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_client_messages_id_fkey" FOREIGN KEY ("client_messages_id") REFERENCES "Client_sms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
