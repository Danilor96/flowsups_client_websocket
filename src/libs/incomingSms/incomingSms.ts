import { prisma } from '../prisma/prisma';
import { io } from '../../websocketServer';
import { assignUserFromRoundRobin } from '../roundRobin/roundRobin';
import { AppointmentData, Sms } from '../definitions';
import { startOfToday, endOfToday } from 'date-fns';
import { createNotification } from '../notification/createNotification';

interface IncomingSmsData {
  from: any;
  message: any;
  file?: { url?: string; name: string };
}

export async function handlingIncomingSms({ from, message, file }: IncomingSmsData) {
  const fromFormatted = from.slice(1);

  const todayIsos = new Date().toISOString();

  const today = new Date(todayIsos);

  let userId: number | null | undefined = null;
  let customerId: number | null | undefined = null;
  let unregisteredCustomerId: number | null = null;
  let appointmentAccepted = '';
  let appointmentAcceptStartDate = '';

  try {
    const clientIdStatusAppointments = await prisma.clients.findFirst({
      where: {
        OR: [
          {
            mobile_phone: fromFormatted,
          },
          {
            home_phone: fromFormatted,
          },
          // {
          //   work_phone: fromFormatted,  consultar para ver si es necesario
          // },
        ],
      },
      select: {
        client_status_id: true,
        id: true,
        first_name: true,
        last_name: true,
        seller: {
          select: {
            id: true,
          },
        },
        appointment: {
          where: {
            status_id: 1,
            start_date: {
              gt: today,
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
          date_sent: today,
          sent_by_user: false,
          client_id: clientIdStatusAppointments.id,
          status_id: 2,
          fileAttachment: file,
          client_phone_number: fromFormatted,
        },
        include: {
          user: {
            select: {
              id: true,
            },
          },
          client_message: {
            select: {
              seller_id: true,
            },
          },
        },
      });

      userId = data?.client_message?.seller_id;
      customerId = clientIdStatusAppointments.id;

      // set the status from customer settings if this customers has status lost

      if (clientIdStatusAppointments.client_status_id === 12) {
        const customersSettings = await prisma.customer_settings.findFirst();

        if (customersSettings) {
          // check if the configuration is setted to activate a customer when contacted
          if (customersSettings.active_lost_customer) {
            const newStatusId = customersSettings.set_active_lost_customer_status_to;

            await prisma.clients.update({
              where: {
                id: clientIdStatusAppointments.id,
              },
              data: {
                client_status_id: newStatusId,
              },
            });
          }
        }
      }
    } else {
      const awaitingCustomer = await prisma.awaiting_unknow_client.findUnique({
        where: {
          mobile_phone_number: fromFormatted,
        },
      });

      // if there is no record in registered customers, then save the sms with the unregistered customer

      if (awaitingCustomer) {
        if (awaitingCustomer.user_id) {
          const data = await prisma.client_sms.create({
            data: {
              message: message,
              date_sent: today,
              sent_by_user: false,
              status_id: 2,
              fileAttachment: file,
              client_phone_number: fromFormatted,
              unregistered_customer: {
                connect: {
                  id: awaitingCustomer.id,
                },
              },
              user: {
                connect: {
                  id: awaitingCustomer.user_id,
                },
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                },
              },
              client_message: {
                select: {
                  seller_id: true,
                },
              },
            },
          });

          userId = data.client_message?.seller_id;
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
                user: {
                  connect: {
                    email: userFromRoundRobin,
                  },
                },
              },
            });

            const data = await prisma.client_sms.create({
              data: {
                message: message,
                date_sent: today,
                sent_by_user: false,
                status_id: 2,
                fileAttachment: file,
                client_phone_number: fromFormatted,
                unregistered_customer: {
                  connect: {
                    id: updatedAwaitingCustomer.id,
                  },
                },
                user: {
                  connect: {
                    email: userFromRoundRobin,
                  },
                },
              },
              include: {
                user: {
                  select: {
                    id: true,
                  },
                },
                client_message: {
                  select: {
                    seller_id: true,
                  },
                },
              },
            });

            unregisteredCustomerId = updatedAwaitingCustomer.id;
            userId = data?.client_message?.seller_id;
          } else {
            // if there is no a round robin user, then save the sms without a related user

            await prisma.client_sms.create({
              data: {
                message: message,
                date_sent: today,
                sent_by_user: false,
                fileAttachment: file,
                client_phone_number: fromFormatted,
                status_id: 2,
                unregistered_customer: {
                  connect: {
                    mobile_phone_number: fromFormatted,
                  },
                },
              },
            });
          }
        }

        unregisteredCustomerId = awaitingCustomer.id;
      } else {
        // if there is no record in unregistered customers (awaiting clients), then create it,
        // assigns a round robin user and save the sms

        const unregisteredCustomer = await prisma.awaiting_unknow_client.create({
          data: {
            mobile_phone_number: fromFormatted,
          },
        });

        const userFromRoundRobin = await assignUserFromRoundRobin(fromFormatted);

        let sms: Sms | null = null;

        if (userFromRoundRobin) {
          // if there is assigned a user from round robin, then makes the relation establishment

          sms = await prisma.client_sms.create({
            data: {
              message: message,
              date_sent: today,
              sent_by_user: false,
              status_id: 2,
              fileAttachment: file,
              client_phone_number: fromFormatted,
              unregistered_customer: {
                connect: {
                  id: unregisteredCustomer.id,
                },
              },
              user: {
                connect: {
                  email: userFromRoundRobin,
                },
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                },
              },
              client_message: {
                select: {
                  seller_id: true,
                },
              },
            },
          });

          userId = sms?.client_message?.seller_id;
        } else {
          // create the sms without a related user

          sms = await prisma.client_sms.create({
            data: {
              message: message,
              date_sent: today,
              sent_by_user: false,
              status_id: 2,
              fileAttachment: file,
              client_phone_number: fromFormatted,
              unregistered_customer: {
                connect: {
                  id: unregisteredCustomer.id,
                },
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                },
              },
              client_message: {
                select: {
                  seller_id: true,
                },
              },
            },
          });
        }

        userId = sms?.client_message?.seller_id;
        unregisteredCustomerId = unregisteredCustomer.id;
      }
    }

    if (
      clientIdStatusAppointments &&
      clientIdStatusAppointments.client_status_id &&
      clientIdStatusAppointments.client_status_id === 1
    ) {
      const userStatus = await prisma.clients.update({
        where: {
          id: clientIdStatusAppointments.id,
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
          created_at: today,
          assigned_to_id: clientIdStatusAppointments?.seller?.id || 1,
          client_id: clientIdStatusAppointments.id,
          status_id: 2,
          created_by_id: clientIdStatusAppointments?.seller?.id || 1,
          lead_id: 7,
        },
      });
    }

    // check if the message contain 'Y', 'YES', 'N', or 'S'

    const specialCharactersToAccept = ['Y', 'S', 'YES'];
    const specialCharactersToCancel = ['N'];

    const messageSplitted = message.split(' ');

    // accept appointment
    if (messageSplitted.every((word: string) => specialCharactersToAccept.includes(word))) {
      // check if the customer has a pending for confirmation appointment

      if (
        clientIdStatusAppointments?.appointment &&
        clientIdStatusAppointments.appointment.length > 0
      ) {
        let apptData: AppointmentData | undefined;

        clientIdStatusAppointments.appointment.forEach(async (el) => {
          if (el.status_id === 1 && new Date(el.start_date) > today) {
            apptData = await prisma.appointments.update({
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

        const userAppointmentId = clientIdStatusAppointments.seller?.id;

        await createNotification({
          message: `Customer ${clientIdStatusAppointments.first_name} ${
            clientIdStatusAppointments.last_name
          } has accepted the appointment for ${
            apptData
              ? new Date(apptData.start_date).toLocaleString('en-US', {
                  day: '2-digit',
                  weekday: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''
          }`,
          notificationType: {
            appointment: true,
          },
          assignedToId: userAppointmentId ? [userAppointmentId] : [],
          notificationsForManagers: true,
          eventTypeId: 14,
        });

        await prisma.events.create({
          data: {
            description: 'Appointment accepted',
            updated_at: new Date(),
            client_id: clientIdStatusAppointments.id,
          },
        });

        appointmentAccepted = '1';
        appointmentAcceptStartDate = apptData?.start_date ? apptData.start_date.toISOString() : '';

        io.emit('update_data', 'dailyAppointmentsList');
      }
    }

    // cancel appointment
    if (messageSplitted.every((word: string) => specialCharactersToCancel.includes(word))) {
      // check if the customer has a pending for confirmation appointment

      if (clientIdStatusAppointments?.appointment) {
        let appointmentForToday = false;

        clientIdStatusAppointments.appointment.forEach(async (el) => {
          if (el.status_id === 1 && new Date(el.start_date) > today) {
            await prisma.appointments.update({
              where: {
                id: el.id,
              },
              data: {
                status_id: 3,
                client_accept_appointment: true,
              },
            });

            if (new Date(el.start_date) < endOfToday()) appointmentForToday = true;
          }
        });

        if (appointmentForToday) {
          io.emit('update_data', 'dailyAppointmentsList');
        }
      }
    }

    // create sms notification

    await createNotification({
      message: message,
      notificationType: {
        customer: true,
      },
      assignedToId: userId ? [userId] : [],
      unregisteredCustomerId: unregisteredCustomerId || undefined,
      customerId: customerId || undefined,
      eventTypeId: 25,
    });

    await prisma.$disconnect();

    io.emit('update_data', 'customerMessage', {
      appointment: appointmentAccepted,
      appointmentStartDate: appointmentAcceptStartDate,
    });

    io.emit('update_data', 'notifications');
    io.emit('update_data', 'smsModal');
  } catch (error) {
    console.log(error);
  }
}
