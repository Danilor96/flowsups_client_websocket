/*
  Warnings:

  - You are about to drop the `Clients_has_messages` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `client_id` to the `Client_sms` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Clients_has_messages" DROP CONSTRAINT "Clients_has_messages_client_id_fkey";

-- DropForeignKey
ALTER TABLE "Clients_has_messages" DROP CONSTRAINT "Clients_has_messages_message_id_fkey";

-- AlterTable
ALTER TABLE "Client_sms" ADD COLUMN     "client_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Clients_has_messages";

-- AddForeignKey
ALTER TABLE "Client_sms" ADD CONSTRAINT "Client_sms_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
