import { prisma } from '../prisma/prisma';

export async function assignUserToUnknowCustomer(userEmail: string, mobilePhone: string) {
  try {
    const data = await prisma.awaiting_unknow_client.update({
      where: {
        mobile_phone_number: mobilePhone,
      },
      data: {
        Users: {
          connect: {
            email: userEmail,
          },
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
}
