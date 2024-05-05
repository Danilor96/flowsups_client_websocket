/*
  Warnings:

  - You are about to drop the column `token` on the `Users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Users_token_key";

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "token";

-- CreateTable
CREATE TABLE "Users_has_codes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "code_id" INTEGER NOT NULL,
    "forgot_password_code_id" INTEGER,

    CONSTRAINT "Users_has_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activation_codes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "activation_code_expired" TIMESTAMP(3) NOT NULL,
    "forgot_password_code" TEXT,
    "forgot_password_code_expired" TIMESTAMP(3),

    CONSTRAINT "Activation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Activation_codes_code_key" ON "Activation_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Activation_codes_forgot_password_code_key" ON "Activation_codes"("forgot_password_code");

-- AddForeignKey
ALTER TABLE "Users_has_codes" ADD CONSTRAINT "Users_has_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users_has_codes" ADD CONSTRAINT "Users_has_codes_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "Activation_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
