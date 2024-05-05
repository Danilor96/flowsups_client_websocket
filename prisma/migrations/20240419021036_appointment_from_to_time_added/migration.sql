/*
  Warnings:

  - Added the required column `from_time` to the `Appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `to_time` to the `Appointments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Users_has_codes" DROP CONSTRAINT "Users_has_codes_code_id_fkey";

-- AlterTable
ALTER TABLE "Appointments" ADD COLUMN     "from_time" TEXT NOT NULL,
ADD COLUMN     "to_time" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Users_has_codes" ADD CONSTRAINT "Users_has_codes_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "Activation_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
