/*
  Warnings:

  - You are about to drop the column `client_id` on the `Client_has_cobuyer` table. All the data in the column will be lost.
  - You are about to drop the column `cobuyer_id` on the `Client_has_cobuyer` table. All the data in the column will be lost.
  - Added the required column `buyer_client_id` to the `Client_has_cobuyer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cobuyer_client_id` to the `Client_has_cobuyer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Client_has_cobuyer" DROP CONSTRAINT "Client_has_cobuyer_client_id_fkey";

-- DropForeignKey
ALTER TABLE "Client_has_cobuyer" DROP CONSTRAINT "Client_has_cobuyer_cobuyer_id_fkey";

-- AlterTable
ALTER TABLE "Client_has_cobuyer" DROP COLUMN "client_id",
DROP COLUMN "cobuyer_id",
ADD COLUMN     "buyer_client_id" INTEGER NOT NULL,
ADD COLUMN     "cobuyer_client_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Client_has_cobuyer" ADD CONSTRAINT "Client_has_cobuyer_buyer_client_id_fkey" FOREIGN KEY ("buyer_client_id") REFERENCES "Clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_has_cobuyer" ADD CONSTRAINT "Client_has_cobuyer_cobuyer_client_id_fkey" FOREIGN KEY ("cobuyer_client_id") REFERENCES "Clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
