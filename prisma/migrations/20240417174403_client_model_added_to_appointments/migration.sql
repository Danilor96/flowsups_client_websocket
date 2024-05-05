-- DropForeignKey
ALTER TABLE "Appointments" DROP CONSTRAINT "Appointments_customer_id_fkey";

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
