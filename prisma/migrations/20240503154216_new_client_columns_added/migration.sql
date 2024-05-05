-- AlterTable
ALTER TABLE "Clients" ADD COLUMN     "ad_id" INTEGER,
ADD COLUMN     "client_status_id" INTEGER,
ADD COLUMN     "cobuyer" BOOLEAN,
ADD COLUMN     "note_id" INTEGER;

-- CreateTable
CREATE TABLE "Notes" (
    "id" SERIAL NOT NULL,
    "note" TEXT NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad_id" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,

    CONSTRAINT "Ad_id_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client_has_cobuyer" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "cobuyer_id" INTEGER NOT NULL,

    CONSTRAINT "Client_has_cobuyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client_status" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Client_status_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Client_has_cobuyer" ADD CONSTRAINT "Client_has_cobuyer_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_has_cobuyer" ADD CONSTRAINT "Client_has_cobuyer_cobuyer_id_fkey" FOREIGN KEY ("cobuyer_id") REFERENCES "Clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "Notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "Ad_id"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_client_status_id_fkey" FOREIGN KEY ("client_status_id") REFERENCES "Client_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;
