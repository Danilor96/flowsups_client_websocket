-- DropForeignKey
ALTER TABLE "Appointments" DROP CONSTRAINT "Appointments_vehicle_id_fkey";

-- AlterTable
ALTER TABLE "Appointments" ALTER COLUMN "mobile_phone" DROP NOT NULL,
ALTER COLUMN "vehicle_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
