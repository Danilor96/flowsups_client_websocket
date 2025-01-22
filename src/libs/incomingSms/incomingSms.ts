import { prisma } from '../prisma/prisma';
import { io } from '../../websocketServer';
import { assignUserFromRoundRobin } from '../roundRobin/roundRobin';

interface IncomingSmsData {
  from: any;
  message: any;
}

export async function handlingIncomingSms({ from, message }: IncomingSmsData) {
  const fromFormatted = from.slice(1);

  try {
    const clientIdStatusAppointments = await prisma.clients.findFirst({
      where: {
        mobile_phone: fromFormatted,
      },
      select: {
        client_status_id: true,
        id: true,
        seller: {
          select: {
            id: true,
          },
        },
        appointment: {
          where: {
            status_id: 1,
            start_date: {
              gt: new Date(),
            },
          },
          select: {
            id: true,
            status_id: true,
            start_date: true,
          },
        },
      },
    });

    if (clientIdStatusAppointments && clientIdStatusAppointments.id) {
      const data = await prisma.client_sms.create({
        data: {
          message: message,
          date_sent: new Date(),
          sent_by_user: false,
          client_id: clientIdStatusAppointments.id,
          status_id: 2,
        },
      });
    } else {
      const awaitingCustomer = await prisma.awaiting_unknow_client.findUnique({
        where: {
          mobile_phone_number: fromFormatted,
        },
      });

      // if there is no record in registered customers, then save the sms with the unregistered customer

      if (awaitingCustomer) {
        if (awaitingCustomer.user_id) {
          await prisma.client_sms.create({
            data: {
              message: message,
              date_sent: new Date(),
              sent_by_user: false,
              status_id: 2,
              Awaiting_unknow_client: {
                connect: {
                  id: awaitingCustomer.id,
                },
              },
              Users: {
                connect: {
                  id: awaitingCustomer.user_id,
                },
              },
            },
          });
        } else {
          // if the unregistered customer hasn't a user assigned, then assigned it from round robin and
          // save the sms

          const userFromRoundRobin = await assignUserFromRoundRobin(fromFormatted);

          if (userFromRoundRobin) {
            const updatedAwaitingCustomer = await prisma.awaiting_unknow_client.update({
              where: {
                mobile_phone_number: fromFormatted,
              },
              data: {
                Users: {
                  connect: {
                    email: userFromRoundRobin,
                  },
                },
              },
            });

            await prisma.client_sms.create({
              data: {
                message: message,
                date_sent: new Date(),
                sent_by_user: false,
                status_id: 2,
                Awaiting_unknow_client: {
                  connect: {
                    id: updatedAwaitingCustomer.id,
                  },
                },
                Users: {
                  connect: {
                    email: userFromRoundRobin,
                  },
                },
              },
            });
          } else {
            // if there is no a round robin user, then save the sms without a related user

            await prisma.client_sms.create({
              data: {
                message: message,
                date_sent: new Date(),
                sent_by_user: false,
                status_id: 2,
                Awaiting_unknow_client: {
                  connect: {
                    mobile_phone_number: fromFormatted,
                  },
                },
              },
            });
          }
        }
      } else {
        // if there is no record in unregistered customers (awaiting clients), then create it
        // and assigns a round robin user

        const userFromRoundRobin = await assignUserFromRoundRobin(fromFormatted);

        if (userFromRoundRobin) {
          // if there is a round robin user, then assigned it and save the sms

          const unregisteredCustomer = await prisma.awaiting_unknow_client.create({
            data: {
              mobile_phone_number: fromFormatted,
              Users: {
                connect: {
                  email: userFromRoundRobin,
                },
              },
            },
          });

          const sms = await prisma.client_sms.create({
            data: {
              message: message,
              date_sent: new Date(),
              sent_by_user: false,
              status_id: 2,
              Awaiting_unknow_client: {
                connect: {
                  id: unregisteredCustomer.id,
                },
              },
              Users: {
                connect: {
                  email: userFromRoundRobin,
                },
              },
            },
          });
        } else {
          // if there is no round robin user, then save de unregistered customer & the sms

          const unregisteredCustomer = await prisma.awaiting_unknow_client.create({
            data: {
              mobile_phone_number: fromFormatted,
              Users: {
                connect: {
                  email: userFromRoundRobin,
                },
              },
            },
          });

          const sms = await prisma.client_sms.create({
            data: {
              message: message,
              date_sent: new Date(),
              sent_by_user: false,
              status_id: 2,
              Awaiting_unknow_client: {
                connect: {
                  id: unregisteredCustomer.id,
                },
              },
            },
          });
        }
      }
    }

    if (
      clientIdStatusAppointments &&
      clientIdStatusAppointments.client_status_id &&
      clientIdStatusAppointments.client_status_id === 1
    ) {
      const userStatus = await prisma.clients.update({
        where: {
          mobile_phone: fromFormatted,
        },
        data: {
          client_status_id: 2,
        },
      });
    }

    // create a new lead register

    if (clientIdStatusAppointments?.id) {
      const lead = await prisma.client_has_lead.create({
        data: {
          created_at: new Date(),
          assigned_to_id: clientIdStatusAppointments?.seller?.id || 1,
          client_id: clientIdStatusAppointments.id,
          status_id: 2,
          created_by_id: clientIdStatusAppointments?.seller?.id || 1,
          lead_id: 7,
        },
      });
    }

    // check if the message contain 'Y' , 'N' or 'S'

    const specialCharactersToAccept = ['Y', 'S'];
    const specialCharactersToCancel = ['N'];

    const messageSplitted = message.split(' ');

    // accept appointment
    if (messageSplitted.every((word: string) => specialCharactersToAccept.includes(word))) {
      // check if the customer has a pending for confirmation appointment

      if (clientIdStatusAppointments?.appointment) {
        clientIdStatusAppointments.appointment.forEach(async (el) => {
          if (el.status_id === 1 && new Date(el.start_date) > new Date()) {
            await prisma.appointments.update({
              where: {
                id: el.id,
              },
              data: {
                status_id: 6,
                client_accept_appointment: true,
              },
            });
          }
        });

        await prisma.clients.update({
          where: {
            id: clientIdStatusAppointments.id,
          },
          data: {
            client_status_id: 6,
          },
        });
      }
    }

    // cancel appointment
    if (messageSplitted.every((word: string) => specialCharactersToCancel.includes(word))) {
      // check if the customer has a pending for confirmation appointment

      if (clientIdStatusAppointments?.appointment) {
        clientIdStatusAppointments.appointment.forEach(async (el) => {
          if (el.status_id === 1 && new Date(el.start_date) > new Date()) {
            await prisma.appointments.update({
              where: {
                id: el.id,
              },
              data: {
                status_id: 3,
                client_accept_appointment: true,
              },
            });
          }
        });
      }
    }

    await prisma.$disconnect();

    io.emit('update_data', 'customerMessage');
  } catch (error) {
    console.log(error);
  }
}
