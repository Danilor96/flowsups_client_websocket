import { prisma } from '../prisma/prisma';

export async function addUserThatHasRespondedToTransferCall(callSid: string, mobilePhone: string) {
  try {
    const user = await prisma.users.findUnique({
      where: {
        mobile_phone: mobilePhone,
      },
      select: {
        id: true,
      },
    });

    if (user) {
      const userAlreadyRegistered = await prisma.client_calls.findFirst({
        where: {
          call_sid: callSid,
          user_id: {
            has: user.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (!userAlreadyRegistered) {
        const data = await prisma.client_calls.update({
          where: {
            call_sid: callSid,
          },
          data: {
            user_id: {
              push: user.id,
            },
          },
          select: {
            user_id: true,
          },
        });

        return data;
      }
    }
  } catch (error) {
    console.log(error);
  }
}
