-- DropForeignKey
ALTER TABLE "Clients" DROP CONSTRAINT "Clients_client_messages_id_fkey";

-- CreateTable
CREATE TABLE "Clients_has_messages" (
    "message_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,

    CONSTRAINT "Clients_has_messages_pkey" PRIMARY KEY ("client_id","message_id")
);

-- AddForeignKey
ALTER TABLE "Clients_has_messages" ADD CONSTRAINT "Clients_has_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Client_sms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients_has_messages" ADD CONSTRAINT "Clients_has_messages_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
