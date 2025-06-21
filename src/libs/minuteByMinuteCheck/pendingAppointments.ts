import { prisma } from '../prisma/prisma';
import { io, sendTo } from '../../websocketServer';
import { parseISO } from 'date-fns';
import { createNotification } from '../notification/createNotification';

export async function pendingAppointments() {
  try {
    const todayIsos = new Date().toISOString();

    const today = parseISO(todayIsos);

    const lateAppointments = await prisma.appointments.findMany({
      where: {
        end_date: {
          lt: today,
        },
        OR: [
          {
            status_id: 1,
          },
          {
            status_id: 6,
          },
        ],
      },
      include: {
        customers: true,
      },
    });

    if (lateAppointments && lateAppointments.length > 0) {
      const appointmentsUpdated = await prisma.appointments.updateMany({
        where: {
          end_date: {
            lt: today,
          },
        },
        data: {
          status_id: 3,
        },
      });

      const appt = await prisma.clients.updateMany({
        where: {
          appointment: {
            every: {
              end_date: {
                lt: today,
              },
              AND: {
                status_id: 1,
              },
            },
          },
        },
        data: {
          client_status_id: 8,
        },
      });

      // set the customer status to No Show Up
      //
      lateAppointments.forEach(async (appt) => {
        await createNotification({
          message: `The appointment with ${appt.customers.first_name} ${appt.customers.last_name} has expired`,
          notificationType: {
            appointment: true,
          },
          assignedToId: appt.customers.seller_id ? [appt.customers.seller_id] : [],
          notificationsForManagers: true,
          eventTypeId: 26,
        });
      });
    }

    await prisma.$disconnect();

    if (lateAppointments && lateAppointments.length > 0) {
      io.emit('update_data', 'notifications');

      io.emit('update_data', 'dailyAppointmentsList');

      io.emit('update_data', 'customersList');

      io.emit('update_data', 'appointments');
    }
  } catch (error) {
    console.log(error);
  }
}
