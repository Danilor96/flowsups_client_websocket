/*
  Warnings:

  - You are about to drop the column `customer_id` on the `Chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `status_id` on the `Chat_messages` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Chat_messages" DROP CONSTRAINT "Chat_messages_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "Chat_messages" DROP CONSTRAINT "Chat_messages_status_id_fkey";

-- AlterTable
ALTER TABLE "Chat_messages" DROP COLUMN "customer_id",
DROP COLUMN "status_id";
