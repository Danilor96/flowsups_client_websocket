-- AlterTable
ALTER TABLE "Client_has_lead" ADD COLUMN     "lost_reason_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Client_has_lead" ADD CONSTRAINT "Client_has_lead_lost_reason_id_fkey" FOREIGN KEY ("lost_reason_id") REFERENCES "Lost_reason"("id") ON DELETE SET NULL ON UPDATE CASCADE;
