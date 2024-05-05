-- DropForeignKey
ALTER TABLE "Users_has_codes" DROP CONSTRAINT "Users_has_codes_code_id_fkey";

-- AddForeignKey
ALTER TABLE "Users_has_codes" ADD CONSTRAINT "Users_has_codes_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "Activation_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
