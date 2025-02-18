import { prisma } from '../prisma/prisma';

export async function checkIfCustomerIsInAwaitingTable(customerMobilePhone: string) {
  try {
    const awaitingCustomer = await prisma.awaiting_unknow_client.findUnique({
      where: {
        mobile_phone_number: customerMobilePhone,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return awaitingCustomer;
  } catch (error) {
    console.log(error);
  }
}
