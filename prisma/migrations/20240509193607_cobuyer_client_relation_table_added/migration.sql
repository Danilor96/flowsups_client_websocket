/*
  Warnings:

  - Added the required column `relationship_id` to the `Client_has_cobuyer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client_has_cobuyer" ADD COLUMN     "relationship_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Cobuyer_client_relationship" (
    "id" SERIAL NOT NULL,
    "relationship" TEXT NOT NULL,

    CONSTRAINT "Cobuyer_client_relationship_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Client_has_cobuyer" ADD CONSTRAINT "Client_has_cobuyer_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "Cobuyer_client_relationship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
