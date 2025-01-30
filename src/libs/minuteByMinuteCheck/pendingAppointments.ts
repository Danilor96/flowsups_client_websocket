import { prisma } from '../prisma/prisma';
import { io, sendTo } from '../../websocketServer';

export async function pendingAppointments() {
  try {
    const lateAppointments = await prisma.appointments.findMany({
      where: {
        end_date: {
          lt: new Date(),
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
            lt: new Date(),
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
                lt: new Date(),
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

      lateAppointments.forEach(async (appt) => {
        const notifications = await prisma.notifications.create({
          data: {
            message: `The appointment with ${appt.customers.first_name} ${appt.customers.last_name} has expired`,
            type_id: 2,
            user_id: appt.customers.seller_id,
            notification_for_managers: true,
          },
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
