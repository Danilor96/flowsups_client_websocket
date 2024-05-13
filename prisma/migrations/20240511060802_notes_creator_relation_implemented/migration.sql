/*
  Warnings:

  - You are about to drop the column `created_by` on the `Notes` table. All the data in the column will be lost.
  - Added the required column `created_by_id` to the `Notes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notes" DROP COLUMN "created_by",
ADD COLUMN     "created_by_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Notes" ADD CONSTRAINT "Notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
