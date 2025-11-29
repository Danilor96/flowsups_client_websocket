import { prisma } from '../prisma/prisma';
import { io } from '../../websocketServer';
import { createNotification } from '../notification/createNotification';
import { SMS_STATUS_ID } from '../definitions';

export async function smsStatus(
  to: string,
  status: string,
  errorMessage: string,
  errorCode: string,
  messageSid: string,
) {
  try {
    // messages statuses
    // 1) sent
    // 2) delivered
    // 2) failed

    if (messageSid && (!errorCode || errorMessage) && typeof messageSid === 'string') {
      if (status === 'sent') {
        const sms = await prisma.client_sms.update({
          where: {
            message_sid: messageSid,
          },
          data: {
            sent: true,
            date_sent: new Date(),
          },
          include: {
            client_message: {
              select: {
                mobile_phone: true,
              },
            },
            unregistered_customer: {
              select: {
                mobile_phone_number: true,
              },
            },
            user: {
              select: {
                id: true,
              },
            },
          },
        });

        const previousSms = await prisma.client_sms.findFirst({
          where: {
            client_id: sms.client_id,
            id: { not: sms.id },
          },
          orderBy: {
            date_sent: 'desc',
          },
        });

        if (previousSms?.status_id === SMS_STATUS_ID.REPLIED || !previousSms?.sent_by_user) {
          if (previousSms?.client_id) {
            const data = {
              pending_reply_count: 0,
              last_message_from_client: false,
              last_message_date: new Date().toISOString(),
            };
            await prisma.conversations.upsert({
              where: { client_id: previousSms.client_id },
              update: data,
              create: {
                client_id: previousSms.client_id,
                ...data,
              },
            });
          }
        }

        const customerActivity = await prisma.clients.update({
          where: {
            mobile_phone: sms.client_message?.mobile_phone,
          },
          data: {
            last_activity: new Date(),
          },
        });

        // check if sms configuration is setted to active lost customers after send them a message

        // get the customer status & messages

        const customerStatusAndMessages = await prisma.clients.findUnique({
          where: {
            mobile_phone: sms.client_message?.mobile_phone,
          },
          select: {
            id: true,
            client_status: {
              select: {
                id: true,
              },
            },
            message: {
              orderBy: {
                date_sent: 'asc',
              },
            },
          },
        });

        // get customer configuration

        const configSms = await prisma.customer_settings.findFirst();

        // check if the status of the customer is lost --> 12

        if (customerStatusAndMessages?.client_status?.id === 12) {
          // check if the customer config is setted to active lost customers

          if (configSms?.active_lost_customer) {
            // get the "customer avtivation status to" config parameter in
            // order to active the customer from lost to the activation status
            const activatingStatusStablished = configSms.set_active_lost_customer_status_to;

            await prisma.clients.update({
              where: {
                id: customerStatusAndMessages.id,
              },
              data: {
                client_status_id: activatingStatusStablished ? activatingStatusStablished : 2,
              },
            });
          }
        }

        // check if the customer has a message to be answered

        interface CustomerMessages {
          message: string;
          id: number;
          status_id: number;
          client_id: number | null;
          message_sid: string | null;
          sent: boolean;
          delivered: boolean;
          date_sent: Date | null;
          sent_by_user: boolean;
          read_by: number[];
        }

        const customerMessages = customerStatusAndMessages?.message;

        // function to check if the sended message was used to answer a previous customer message
        const checkTheSmsBeforeTheOneThatWasSent = (
          customerMessagesArray: CustomerMessages[] | undefined,
        ) => {
          let result = false;

          const smsBeforeLastSent = customerMessagesArray?.at(-2);

          if (smsBeforeLastSent) {
            if (!smsBeforeLastSent.sent_by_user) {
              result = true;
            }
          }

          return result;
        };

        if (checkTheSmsBeforeTheOneThatWasSent(customerMessages) && sms) {
          const answeredSms = await prisma.client_sms.update({
            where: {
              id: sms.id,
            },
            data: {
              status_id: SMS_STATUS_ID.REPLIED,
            },
          });
        }

        // create a new lead register

        const lead = await prisma.client_has_lead.create({
          data: {
            created_at: new Date(),
            assigned_to_id: sms.user[0].id,
            client_id: customerActivity.id,
            status_id: 2,
            created_by_id: sms.user[0].id,
            lead_id: 7,
          },
        });

        io.emit('update_data', 'smsModal');
        io.emit('update_data', 'dailyTotals');
      }

      if (status === 'delivered') {
        const sms = await prisma.client_sms.update({
          where: {
            message_sid: messageSid,
          },
          data: {
            delivered: true,
          },
        });

        io.emit('update_data', 'smsModal');
      }
    }

    if (errorCode && errorMessage && typeof messageSid === 'string') {
      if (status === 'failed') {
        // const sms = await prisma.client_sms.delete({
        //   where: {
        //     message_sid: messageSid,
        //   },
        //   include: {
        //     user: {
        //       select: {
        //         id: true,
        //       },
        //     },
        //   },
        // });
        
        const sms = await prisma.client_sms.update({
          where: {
            message_sid: messageSid,
          },
          data: {
            delivered: false,
            sent: false,
            failed: true,
          },
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        });

        await createNotification({
          message: `Error sending SMS to client ${to}`,
          notificationType: {
            warning: true,
          },
          assignedToId: [sms.user[0].id],
          notificationsForManagers: true,
        });

        io.emit('update_data', 'smsModal');
      }
    }
  } catch (error) {
    console.log(error);
  }
}
