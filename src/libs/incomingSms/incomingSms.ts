import { prisma } from '../prisma/prisma';
import { io } from '../../websocketServer';

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
