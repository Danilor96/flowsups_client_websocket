-- AlterTable
ALTER TABLE "Clients" ADD COLUMN     "client_type_id" INTEGER;

-- CreateTable
CREATE TABLE "Client_types" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Client_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_client_type_id_fkey" FOREIGN KEY ("client_type_id") REFERENCES "Client_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
