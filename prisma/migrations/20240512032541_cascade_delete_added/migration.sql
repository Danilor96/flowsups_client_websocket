-- DropForeignKey
ALTER TABLE "Client_has_cobuyer" DROP CONSTRAINT "Client_has_cobuyer_buyer_client_id_fkey";

-- DropForeignKey
ALTER TABLE "Client_has_cobuyer" DROP CONSTRAINT "Client_has_cobuyer_cobuyer_client_id_fkey";

-- DropForeignKey
ALTER TABLE "Client_sms" DROP CONSTRAINT "Client_sms_client_id_fkey";

-- DropForeignKey
ALTER TABLE "Clients_has_files" DROP CONSTRAINT "Clients_has_files_client_id_fkey";

-- DropForeignKey
ALTER TABLE "Clients_has_languages" DROP CONSTRAINT "Clients_has_languages_client_id_fkey";

-- AddForeignKey
ALTER TABLE "Clients_has_languages" ADD CONSTRAINT "Clients_has_languages_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients_has_files" ADD CONSTRAINT "Clients_has_files_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_has_cobuyer" ADD CONSTRAINT "Client_has_cobuyer_buyer_client_id_fkey" FOREIGN KEY ("buyer_client_id") REFERENCES "Clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_has_cobuyer" ADD CONSTRAINT "Client_has_cobuyer_cobuyer_client_id_fkey" FOREIGN KEY ("cobuyer_client_id") REFERENCES "Clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_sms" ADD CONSTRAINT "Client_sms_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
