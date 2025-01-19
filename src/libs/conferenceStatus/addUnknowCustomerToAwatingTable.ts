import { prisma } from '../prisma/prisma';

export async function addUnknowCustomerToAwatingTable(customerMobilePhone: string) {
  try {
    const addAwatingCustomer = await prisma.awaiting_unknow_client.create({
      data: {
        mobile_phone_number: customerMobilePhone,
      },
    });
  } catch (error) {
    console.log(error);
  }
}
