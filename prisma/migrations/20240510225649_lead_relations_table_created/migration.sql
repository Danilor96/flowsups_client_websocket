-- CreateTable
CREATE TABLE "Client_has_lead" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "follow_up_date" TIMESTAMP(3) NOT NULL,
    "assigned_to_id" INTEGER NOT NULL,
    "note_id" INTEGER NOT NULL,
    "reminder_time" TIMESTAMP(3) NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "incoming" BOOLEAN NOT NULL,
    "outcoming" BOOLEAN NOT NULL,
    "dealdate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_has_lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lost_reason" (
    "id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "Lost_reason_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Client_has_lead" ADD CONSTRAINT "Client_has_lead_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Client_detail_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_has_lead" ADD CONSTRAINT "Client_has_lead_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_has_lead" ADD CONSTRAINT "Client_has_lead_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "Notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_has_lead" ADD CONSTRAINT "Client_has_lead_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
