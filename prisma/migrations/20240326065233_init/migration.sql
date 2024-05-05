-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "emailVerified" TIMESTAMP(3),
    "token" TEXT NOT NULL,
    "sessions_expires" TIMESTAMP(3),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissions" (
    "id" SERIAL NOT NULL,
    "permission" TEXT NOT NULL,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roles_has_permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "Roles_has_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users_has_roles" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Users_has_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customers_age" (
    "id" SERIAL NOT NULL,
    "gender" TEXT NOT NULL,

    CONSTRAINT "Customers_age_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customers_status" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Customers_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customers_gender" (
    "id" SERIAL NOT NULL,
    "gender" TEXT NOT NULL,

    CONSTRAINT "Customers_gender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "age_id" INTEGER NOT NULL,
    "gender_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,

    CONSTRAINT "Customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat_messages_status" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Chat_messages_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat_messages" (
    "id" SERIAL NOT NULL,
    "messages" TEXT NOT NULL,
    "sent_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,

    CONSTRAINT "Chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointments_status" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Appointments_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointments" (
    "id" SERIAL NOT NULL,
    "appointment_date" TIMESTAMP(3) NOT NULL,
    "status_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_brands" (
    "id" SERIAL NOT NULL,
    "brand" TEXT NOT NULL,

    CONSTRAINT "Vehicle_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_colors" (
    "id" SERIAL NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Vehicle_colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_models" (
    "id" SERIAL NOT NULL,
    "model" TEXT NOT NULL,

    CONSTRAINT "Vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_manufacture_years" (
    "id" SERIAL NOT NULL,
    "year" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_manufacture_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_fuel_tank_capacities" (
    "id" SERIAL NOT NULL,
    "capacity" TEXT NOT NULL,

    CONSTRAINT "Vehicle_fuel_tank_capacities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_identification_numbers" (
    "id" SERIAL NOT NULL,
    "vin" TEXT NOT NULL,

    CONSTRAINT "Vehicle_identification_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_body_types" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Vehicle_body_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_standard_features" (
    "id" SERIAL NOT NULL,
    "air_conditioning" BOOLEAN NOT NULL,
    "audio_system" BOOLEAN NOT NULL,
    "security_system" BOOLEAN NOT NULL,

    CONSTRAINT "Vehicle_standard_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_transmissions" (
    "id" SERIAL NOT NULL,
    "transmission" TEXT NOT NULL,

    CONSTRAINT "Vehicle_transmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_prices" (
    "id" SERIAL NOT NULL,
    "price" TEXT NOT NULL,

    CONSTRAINT "Vehicle_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_fuel_tank_types" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Vehicle_fuel_tank_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_tech_features" (
    "id" SERIAL NOT NULL,
    "entertainment_system" BOOLEAN NOT NULL,
    "connectivity" BOOLEAN NOT NULL,
    "driving_assistant_system" BOOLEAN NOT NULL,

    CONSTRAINT "Vehicle_tech_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_conditions" (
    "id" SERIAL NOT NULL,
    "new" BOOLEAN NOT NULL,

    CONSTRAINT "Vehicle_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_mileages" (
    "id" SERIAL NOT NULL,
    "mileage" TEXT NOT NULL,

    CONSTRAINT "Vehicle_mileages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle_motors" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "engine_displacement" TEXT NOT NULL,
    "power" TEXT NOT NULL,

    CONSTRAINT "Vehicle_motors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicles" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "color_id" INTEGER NOT NULL,
    "model_id" INTEGER NOT NULL,
    "manufacture_year_id" INTEGER NOT NULL,
    "fuel_tank_capacity_id" INTEGER NOT NULL,
    "identification_id" INTEGER NOT NULL,
    "body_type_id" INTEGER NOT NULL,
    "standard_features_id" INTEGER NOT NULL,
    "transmission_id" INTEGER NOT NULL,
    "price_id" INTEGER NOT NULL,
    "fuel_tank_type_id" INTEGER NOT NULL,
    "tech_features_id" INTEGER NOT NULL,
    "condition_id" INTEGER NOT NULL,
    "mileage_id" INTEGER NOT NULL,
    "motor_id" INTEGER NOT NULL,

    CONSTRAINT "Vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_token_key" ON "Users"("token");

-- AddForeignKey
ALTER TABLE "Roles_has_permissions" ADD CONSTRAINT "Roles_has_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roles_has_permissions" ADD CONSTRAINT "Roles_has_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users_has_roles" ADD CONSTRAINT "Users_has_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users_has_roles" ADD CONSTRAINT "Users_has_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customers" ADD CONSTRAINT "Customers_age_id_fkey" FOREIGN KEY ("age_id") REFERENCES "Customers_age"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customers" ADD CONSTRAINT "Customers_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "Customers_gender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customers" ADD CONSTRAINT "Customers_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "Customers_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat_messages" ADD CONSTRAINT "Chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat_messages" ADD CONSTRAINT "Chat_messages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat_messages" ADD CONSTRAINT "Chat_messages_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "Chat_messages_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "Appointments_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Vehicle_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "Vehicle_colors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "Vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_manufacture_year_id_fkey" FOREIGN KEY ("manufacture_year_id") REFERENCES "Vehicle_manufacture_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_fuel_tank_capacity_id_fkey" FOREIGN KEY ("fuel_tank_capacity_id") REFERENCES "Vehicle_fuel_tank_capacities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_identification_id_fkey" FOREIGN KEY ("identification_id") REFERENCES "Vehicle_identification_numbers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_body_type_id_fkey" FOREIGN KEY ("body_type_id") REFERENCES "Vehicle_body_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_standard_features_id_fkey" FOREIGN KEY ("standard_features_id") REFERENCES "Vehicle_standard_features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_transmission_id_fkey" FOREIGN KEY ("transmission_id") REFERENCES "Vehicle_transmissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "Vehicle_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_fuel_tank_type_id_fkey" FOREIGN KEY ("fuel_tank_type_id") REFERENCES "Vehicle_fuel_tank_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_tech_features_id_fkey" FOREIGN KEY ("tech_features_id") REFERENCES "Vehicle_tech_features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "Vehicle_conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_mileage_id_fkey" FOREIGN KEY ("mileage_id") REFERENCES "Vehicle_mileages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicles" ADD CONSTRAINT "Vehicles_motor_id_fkey" FOREIGN KEY ("motor_id") REFERENCES "Vehicle_motors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
