import { prisma } from '../prisma/prisma';
import { io, sendTo } from '../../websocketServer';
import { managerUsersArray } from './specificUsers/managerUsers';
import { hoursSinceXDate } from './datesDifferences/hourSinceXDate';
import { parseISO } from 'date-fns';
import { createNotification } from '../notification/createNotification';

export async function pendingRescheduleAppointments() {
  try {
    const todayIsos = new Date().toISOString();

    const today = parseISO(todayIsos);

    const pendingReschedule = await prisma.appointments.findMany({
      where: {
        waiting_aprove: true,
        start_date: {
          gt: today,
        },
      },
    });

    if (pendingReschedule && pendingReschedule.length > 0) {
      const managerUsers = await managerUsersArray();

      pendingReschedule.forEach(async (reAppt) => {
        if (reAppt.last_check && hoursSinceXDate(reAppt.last_check) >= 4) {
          await createNotification({
            message: `There is still an appointment to be rescheduled`,
            notificationType: {
              warning: true,
            },
            appointmentId: reAppt.id,
            notificationsForManagers: true,
            eventTypeId: 19,
          });

          await prisma.appointments.update({
            where: {
              id: reAppt.id,
            },
            data: {
              last_check: today,
            },
          });
        }
      });

      if (managerUsers && managerUsers.length > 0) {
        managerUsers.forEach((user) => {
          sendTo(user.email, 'notifications');
        });
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.log(error);
  }
}
