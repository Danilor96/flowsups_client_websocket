-- AlterTable
ALTER TABLE "Clients" ADD COLUMN     "intereseted_vehicle_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_intereseted_vehicle_id_fkey" FOREIGN KEY ("intereseted_vehicle_id") REFERENCES "Vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
