/*
  Warnings:

  - You are about to drop the column `user_id` on the `Chat_messages` table. All the data in the column will be lost.
  - Added the required column `recipient_user_id` to the `Chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_user_id` to the `Chat_messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Chat_messages" DROP CONSTRAINT "Chat_messages_user_id_fkey";

-- AlterTable
ALTER TABLE "Chat_messages" DROP COLUMN "user_id",
ADD COLUMN     "recipient_user_id" INTEGER NOT NULL,
ADD COLUMN     "sender_user_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Chat_messages" ADD CONSTRAINT "Chat_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat_messages" ADD CONSTRAINT "Chat_messages_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
