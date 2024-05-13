/*
  Warnings:

  - The primary key for the `Clients_has_messages` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Clients_has_messages" DROP CONSTRAINT "Clients_has_messages_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Clients_has_messages_pkey" PRIMARY KEY ("id");
