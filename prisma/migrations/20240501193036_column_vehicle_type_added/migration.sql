/*
  Warnings:

  - Added the required column `vehicle_type_id` to the `Vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vehicles" ADD COLUMN     "vehicle_type_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Vehicle_types" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Vehicle_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "Vehicle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
