import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function saveAndAssignUnregisteredCustomersToRoundRobinUsers(phoneNumber: string) {
  const roundRobinUser = await prisma.users.findFirst({
    where: {
      round_robin: true,
      ready_for_leads: true,
    },
    select: {
      id: true,
      round_robin_order: true,
    },
    orderBy: {
      round_robin_order: 'asc',
    },
  });

  if (roundRobinUser) {
    const saveUnknowCustomer = await prisma.awaiting_unknow_client.upsert({
      where: {
        mobile_phone_number: phoneNumber,
      },
      update: {},
      create: {
        mobile_phone_number: phoneNumber,
        user_id: roundRobinUser.id,
      },
    });
  }
}
