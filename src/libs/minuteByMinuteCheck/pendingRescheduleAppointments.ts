import { prisma } from '../prisma/prisma';
import { io, sendTo } from '../../websocketServer';
import { managerUsersArray } from './specificUsers/managerUsers';
import { hoursSinceXDate } from './datesDifferences/hourSinceXDate';

export async function pendingRescheduleAppointments() {
  try {
    const pendingReschedule = await prisma.appointments.findMany({
      where: {
        waiting_aprove: true,
        start_date: {
          gt: new Date(),
        },
      },
    });

    if (pendingReschedule && pendingReschedule.length > 0) {
      const managerUsers = await managerUsersArray();

      pendingReschedule.forEach(async (reAppt) => {
        if (reAppt.last_check && hoursSinceXDate(reAppt.last_check) >= 4) {
          await prisma.notifications.create({
            data: {
              message: `There is still an appointment to be rescheduled`,
              type_id: 5,
              notification_for_managers: true,
            },
          });

          await prisma.appointments.update({
            where: {
              id: reAppt.id,
            },
            data: {
              last_check: new Date(),
            },
          });
        }
      });

      if (managerUsers && managerUsers.length > 0) {
        managerUsers.forEach((user) => {
          io.to(sendTo(user.email)).emit('update_data', 'notifications');
        });
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.log(error);
  }
}
