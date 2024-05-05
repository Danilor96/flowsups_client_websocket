/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `Users_has_codes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Users_has_codes_user_id_key" ON "Users_has_codes"("user_id");
