/*
  Warnings:

  - You are about to drop the `Iquiery_types` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `mobile_phone` to the `Appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicle_id` to the `Appointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointments" ADD COLUMN     "mobile_phone" TEXT NOT NULL,
ADD COLUMN     "vehicle_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Iquiery_types";

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
