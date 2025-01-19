import { prisma } from '../../prisma/prisma';

export async function callAnsweredBy(
  customerMobilePhone: string,
  userEmail?: string,
  userMobilePhone?: string,
) {
  try {
    if (userEmail) {
      const data = await prisma.awaiting_unknow_client.update({
        where: {
          mobile_phone_number: customerMobilePhone,
        },
        data: {
          Users: {
            connect: {
              email: userEmail,
            },
          },
        },
      });
    }

    if (userMobilePhone) {
      const data = await prisma.awaiting_unknow_client.update({
        where: {
          mobile_phone_number: customerMobilePhone,
        },
        data: {
          Users: {
            connect: {
              mobile_phone: userMobilePhone,
            },
          },
        },
      });
    }
  } catch (error) {
    console.log(error);
  }
}
