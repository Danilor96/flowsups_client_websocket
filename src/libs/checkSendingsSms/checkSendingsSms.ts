import { prisma } from '../prisma/prisma';
import { client } from '../../websocketServer';

export async function checkSendingsSms() {
  try {
    const sendingsSms = await prisma.client_sms.findMany({
      where: {
        OR: [
          {
            sent: false,
            message_sid: {
              not: null,
            },
          },
          {
            delivered: false,
            message_sid: {
              not: null,
            },
          },
        ],
      },
      select: {
        id: true,
        message_sid: true,
      },
    });

    if (sendingsSms && sendingsSms.length > 0) {
      for (let i = 0; i < sendingsSms.length; i++) {
        const sms = sendingsSms[i];

        if (sms.message_sid) {
          const smsFeedback = await client.messages(sms.message_sid).fetch();

          const statusesForDeleteSms = ['canceled', 'failed'];

          if (smsFeedback.status === 'delivered') {
            await prisma.client_sms.update({
              where: {
                id: sms.id,
              },
              data: {
                delivered: true,
                sent: true,
              },
            });
          } else if (smsFeedback.status === 'sent') {
            await prisma.client_sms.update({
              where: {
                id: sms.id,
              },
              data: {
                sent: true,
              },
            });
          } else if (statusesForDeleteSms.includes(smsFeedback.status)) {
            await prisma.client_sms.delete({
              where: {
                id: sms.id,
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}
