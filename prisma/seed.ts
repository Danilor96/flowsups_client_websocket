import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const pass = await bcrypt.hash('123456', 10);
  const tok1 = randomUUID?.() ?? randomBytes(32).toString('hex');
  const tok2 = randomUUID?.() ?? randomBytes(32).toString('hex');
  const tok3 = randomUUID?.() ?? randomBytes(32).toString('hex');

  const actualDate = new Date();
  const expiredDate24hrs = new Date(actualDate.getTime() + 24 * 60 * 60 * 1000);

  const clientStatus = [
    {
      id: 1,
      status: 'New',
    },
    {
      id: 2,
      status: 'Contacted',
    },
    {
      id: 3,
      status: 'Credit App',
    },
    {
      id: 4,
      status: 'Delivery',
    },
    {
      id: 5,
      status: 'Undelivered',
    },
    {
      id: 6,
      status: 'Appointment',
    },
    {
      id: 7,
      status: 'Show',
    },
    {
      id: 8,
      status: 'No Show up',
    },
    {
      id: 9,
      status: 'Deposit',
    },
    {
      id: 10,
      status: 'Sold',
    },
    {
      id: 11,
      status: 'Paid',
    },
    {
      id: 12,
      status: 'Lost',
    },
  ];

  /* -------------------- create roles seed logic -------------------- */

  const superUser = await prisma.roles.upsert({
    where: { id: 1 },
    update: {},
    create: {
      role: 'superuser',
    },
  });

  const administrator = await prisma.roles.upsert({
    where: { id: 2 },
    update: {},
    create: {
      role: 'administrator',
    },
  });

  const regular = await prisma.roles.upsert({
    where: { id: 3 },
    update: {},
    create: {
      role: 'regular',
    },
  });

  console.log({ superUser, administrator, regular });

  /* -------------------- create codes seed logic -------------------- */

  const alice_code = await prisma.activation_codes.upsert({
    where: { id: 1 },
    update: {},
    create: {
      code: tok1,
      activation_code_expired: expiredDate24hrs,
    },
  });

  const bob_code = await prisma.activation_codes.upsert({
    where: { id: 2 },
    update: {},
    create: {
      code: tok2,
      activation_code_expired: expiredDate24hrs,
    },
  });

  const daniel_code = await prisma.activation_codes.upsert({
    where: { id: 3 },
    update: {},
    create: {
      code: tok3,
      activation_code_expired: expiredDate24hrs,
    },
  });

  console.log({ alice_code, bob_code, daniel_code });

  /* -------------------- create user seed logic -------------------- */

  const alice = await prisma.users.upsert({
    where: { email: 'alice@prisma.io' },
    update: {},
    create: {
      email: 'alice@prisma.io',
      name: 'Alice',
      last_name: 'Abernathy',
      password: pass,
      user_has: {
        create: [
          {
            role_id: 2,
          },
        ],
      },
      user_code: {
        create: {
          code_id: 1,
        },
      },
    },
  });

  const bob = await prisma.users.upsert({
    where: { email: 'bob@prisma.io' },
    update: {},
    create: {
      email: 'bob@prisma.io',
      name: 'Bob',
      last_name: 'Dylan',
      password: pass,
      user_has: {
        create: [
          {
            role_id: 3,
          },
        ],
      },
      user_code: {
        create: {
          code_id: 2,
        },
      },
    },
  });

  const daniel = await prisma.users.upsert({
    where: { email: 'daniel@prisma.io' },
    update: {},
    create: {
      email: 'daniel@prisma.io',
      name: 'Daniel',
      last_name: 'Romero',
      password: pass,
      user_has: {
        create: [
          {
            role_id: 1,
          },
        ],
      },
      user_code: {
        create: {
          code_id: 3,
        },
      },
    },
  });

  console.log({ alice, bob, daniel });

  /* -------------------- create vehicle seed logic -------------------- */

  const vehicleBody = await prisma.vehicle_body_types.upsert({
    where: { id: 1 },
    update: {},
    create: {
      type: 'body type',
    },
  });

  const vehicleBrand = await prisma.vehicle_brands.upsert({
    where: { id: 1 },
    update: {},
    create: {
      brand: 'Audi',
    },
  });

  const vehicleColor = await prisma.vehicle_colors.upsert({
    where: { id: 1 },
    update: {},
    create: {
      color: 'Black',
    },
  });

  const vehicleCondition = await prisma.vehicle_conditions.upsert({
    where: { id: 1 },
    update: {},
    create: {
      new: true,
    },
  });

  const vehicleTankCapacity = await prisma.vehicle_fuel_tank_capacities.upsert({
    where: { id: 1 },
    update: {},
    create: {
      capacity: 'fule capacity',
    },
  });

  const vehicleFuleTankType = await prisma.vehicle_fuel_tank_types.upsert({
    where: { id: 1 },
    update: {},
    create: {
      type: 'vehicle tank type',
    },
  });

  const vehicleVin = await prisma.vehicle_identification_numbers.upsert({
    where: { id: 1 },
    update: {},
    create: {
      vin: '123456789',
    },
  });

  const vehicleYear = await prisma.vehicle_manufacture_years.upsert({
    where: { id: 1 },
    update: {},
    create: {
      year: '2024',
    },
  });

  const vehicleMileage = await prisma.vehicle_mileages.upsert({
    where: { id: 1 },
    update: {},
    create: {
      mileage: '123456789',
    },
  });

  const vehicleModel = await prisma.vehicle_models.upsert({
    where: { id: 1 },
    update: {},
    create: {
      model: 'R8',
    },
  });

  const vehicleMotor = await prisma.vehicle_motors.upsert({
    where: { id: 1 },
    update: {},
    create: {
      engine_displacement: 'engine displacement',
      power: 'engine power',
      type: 'engine type',
    },
  });

  const vehiclePrice = await prisma.vehicle_prices.upsert({
    where: { id: 1 },
    update: {},
    create: {
      price: '123456789',
    },
  });

  const vehicleFeatures = await prisma.vehicle_standard_features.upsert({
    where: { id: 1 },
    update: {},
    create: {
      air_conditioning: true,
      audio_system: true,
      security_system: true,
    },
  });

  const vehicleTechFeatures = await prisma.vehicle_tech_features.upsert({
    where: { id: 1 },
    update: {},
    create: {
      connectivity: true,
      driving_assistant_system: true,
      entertainment_system: true,
    },
  });

  const vehicleTransmission = await prisma.vehicle_transmissions.upsert({
    where: { id: 1 },
    update: {},
    create: {
      transmission: 'vehicle transmission',
    },
  });

  const vehicleType1 = await prisma.vehicle_types.upsert({
    where: { id: 1 },
    update: {},
    create: {
      type: 'Car',
    },
  });

  const vehicleType2 = await prisma.vehicle_types.upsert({
    where: { id: 2 },
    update: {},
    create: {
      type: 'Bike',
    },
  });

  const vehicleType3 = await prisma.vehicle_types.upsert({
    where: { id: 3 },
    update: {},
    create: {
      type: 'Truck',
    },
  });

  const vehicle = await prisma.vehicles.upsert({
    where: { id: 1 },
    update: {},
    create: {
      body_type_id: 1,
      brand_id: 1,
      color_id: 1,
      condition_id: 1,
      fuel_tank_capacity_id: 1,
      fuel_tank_type_id: 1,
      identification_id: 1,
      manufacture_year_id: 1,
      mileage_id: 1,
      model_id: 1,
      motor_id: 1,
      price_id: 1,
      standard_features_id: 1,
      tech_features_id: 1,
      transmission_id: 1,
      vehicle_type_id: 1,
    },
  });

  /* -------------------- create client seed logic -------------------- */

  const gender1 = await prisma.genders.upsert({
    where: { id: 1 },
    update: {},
    create: {
      gender: 'male',
    },
  });

  const gender2 = await prisma.genders.upsert({
    where: { id: 2 },
    update: {},
    create: {
      gender: 'female',
    },
  });

  const gender3 = await prisma.genders.upsert({
    where: { id: 3 },
    update: {},
    create: {
      gender: 'other',
    },
  });

  const contacMethod1 = await prisma.contact_methods.upsert({
    where: { id: 1 },
    update: {},
    create: {
      method: 'phone call',
    },
  });

  const contacMethod2 = await prisma.contact_methods.upsert({
    where: { id: 2 },
    update: {},
    create: {
      method: 'email',
    },
  });

  const leadSource1 = await prisma.lead_sources.upsert({
    where: { id: 1 },
    update: {},
    create: {
      source: 'facebok',
    },
  });

  const leadSource2 = await prisma.lead_sources.upsert({
    where: { id: 2 },
    update: {},
    create: {
      source: 'web ad',
    },
  });

  const leadType1 = await prisma.lead_types.upsert({
    where: { id: 1 },
    update: {},
    create: {
      type: 'sms',
    },
  });

  const leadType2 = await prisma.lead_types.upsert({
    where: { id: 2 },
    update: {},
    create: {
      type: 'phone',
    },
  });

  const inquiryType = await prisma.inquiry_types.upsert({
    where: { id: 1 },
    update: {},
    create: {
      type: 'inquiry type',
    },
  });

  const clientType = await prisma.client_types.upsert({
    where: { id: 1 },
    update: {},
    create: {
      type: 'person',
    },
  });

  const clientType2 = await prisma.client_types.upsert({
    where: { id: 2 },
    update: {},
    create: {
      type: 'company',
    },
  });

  const clientStatuses1 = await prisma.client_status.upsert({
    where: { id: 1 },
    update: {},
    create: {
      status: 'new',
    },
  });

  const clientStatuses2 = await prisma.client_status.upsert({
    where: { id: 2 },
    update: {},
    create: {
      status: 'contacted',
    },
  });

  const clientStatuses3 = await prisma.client_status.upsert({
    where: { id: 3 },
    update: {},
    create: {
      status: 'credit app',
    },
  });

  const clientStatuses4 = await prisma.client_status.upsert({
    where: { id: 4 },
    update: {},
    create: {
      status: 'Delivery',
    },
  });

  const clientStatuses5 = await prisma.client_status.upsert({
    where: { id: 5 },
    update: {},
    create: {
      status: 'Undelivery',
    },
  });

  const clientStatuses6 = await prisma.client_status.upsert({
    where: { id: 6 },
    update: {},
    create: {
      status: 'appointment',
    },
  });

  const clientStatuses7 = await prisma.client_status.upsert({
    where: { id: 7 },
    update: {},
    create: {
      status: 'show',
    },
  });

  const clientStatuses8 = await prisma.client_status.upsert({
    where: { id: 8 },
    update: {},
    create: {
      status: 'no show up',
    },
  });

  const clientStatuses9 = await prisma.client_status.upsert({
    where: { id: 9 },
    update: {},
    create: {
      status: 'deposit',
    },
  });

  const clientStatuses10 = await prisma.client_status.upsert({
    where: { id: 10 },
    update: {},
    create: {
      status: 'sold',
    },
  });

  const clientStatuses11 = await prisma.client_status.upsert({
    where: { id: 11 },
    update: {},
    create: {
      status: 'paid',
    },
  });

  const clientStatuses12 = await prisma.client_status.upsert({
    where: { id: 12 },
    update: {},
    create: {
      status: 'lost',
    },
  });

  const client1 = await prisma.clients.upsert({
    where: { id: 1 },
    update: {},
    create: {
      born_date: '1996-12-09T00:00:00.000Z',
      cash_down: '123456789',
      contact_time: new Date(),
      current_address: 'my home',
      current_job: 'programer',
      duplicate: 'duplicate',
      email: 'email@email.com',
      home_phone: '123456789',
      name_lastname: 'Daniel Romero',
      mailing_address: 'mailing address',
      mobile_phone: '123456789',
      other_income: 'other income',
      previous_address: 'prev. address',
      previous_job: 'prev. job',
      reference: 'reference',
      referrer: 'referrer',
      social_security: '123456789',
      work_phone: '123456789',
      gender_id: 1,
      seller_id: 2,
      contact_method_id: 1,
      lead_source_id: 1,
      inquiry_type_id: 1,
      lead_type_id: 1,
      client_type_id: 1,
      created_at: new Date(),
    },
  });

  const client2 = await prisma.clients.upsert({
    where: { id: 2 },
    update: {},
    create: {
      born_date: '1994-04-20T00:00:00.000Z',
      cash_down: '123456789',
      contact_time: new Date(),
      current_address: 'my home',
      current_job: 'programer',
      duplicate: 'duplicate',
      email: 'alice@email.com',
      home_phone: '123456789',
      name_lastname: 'Alice Bregman',
      mailing_address: 'mailing address',
      mobile_phone: '123456789',
      other_income: 'other income',
      previous_address: 'prev. address',
      previous_job: 'prev. job',
      reference: 'reference',
      referrer: 'referrer',
      social_security: '123456789',
      work_phone: '123456789',
      gender_id: 2,
      seller_id: 2,
      contact_method_id: 1,
      lead_source_id: 1,
      inquiry_type_id: 1,
      lead_type_id: 1,
      client_type_id: 1,
      created_at: new Date(),
    },
  });

  /* -------------------- create appointment seed logic -------------------- */

  const appointmentStatus = await prisma.appointments_status.upsert({
    where: { id: 1 },
    update: {},
    create: {
      status: 'agended',
    },
  });

  const appointment = await prisma.appointments.upsert({
    where: { id: 1 },
    update: {},
    create: {
      end_date: '2024-04-20T21:00:00.000Z',
      start_date: '2024-04-20T20:30:00.000Z',
      mobile_phone: '123456789',
      status_id: 1,
      customer_id: 1,
      user_id: 2,
      vehicle_id: 1,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
