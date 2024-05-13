-- DropForeignKey
ALTER TABLE "Client_has_lead" DROP CONSTRAINT "Client_has_lead_appointment_id_fkey";

-- DropForeignKey
ALTER TABLE "Client_has_lead" DROP CONSTRAINT "Client_has_lead_assigned_to_id_fkey";

-- DropForeignKey
ALTER TABLE "Client_has_lead" DROP CONSTRAINT "Client_has_lead_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "Client_has_lead" DROP CONSTRAINT "Client_has_lead_note_id_fkey";

-- AlterTable
ALTER TABLE "Client_has_lead" ADD COLUMN     "client_id" INTEGER,
ALTER COLUMN "lead_id" DROP NOT NULL,
ALTER COLUMN "follow_up_date" DROP NOT NULL,
ALTER COLUMN "assigned_to_id" DROP NOT NULL,
ALTER COLUMN "note_id" DROP NOT NULL,
ALTER COLUMN "reminder_time" DROP NOT NULL,
ALTER COLUMN "appointment_id" DROP NOT NULL,
ALTER COLUMN "incoming" DROP NOT NULL,
ALTER COLUMN "outcoming" DROP NOT NULL,
ALTER COLUMN "dealdate" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Client_has_lead" ADD CONSTRAINT "Client_has_lead_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Client_detail_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_has_lead" ADD CONSTRAINT "Client_has_lead_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_has_lead" ADD CONSTRAINT "Client_has_lead_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "Notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_has_lead" ADD CONSTRAINT "Client_has_lead_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_has_lead" ADD CONSTRAINT "Client_has_lead_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
