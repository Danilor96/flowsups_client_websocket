import { prisma } from '../prisma/prisma';
import { io, sendTo } from '../../websocketServer';
import { managerUsersArray } from './specificUsers/managerUsers';
import { hoursUntilXDate } from './datesDifferences/hoursUntilXDate';
import { minutesSinceXDate } from './datesDifferences/minutesSinceXDate';

export async function pendingDeliveries() {
  try {
    const pendingDeliveries = await prisma.vehicle_delivery.findMany({
      include: {
        customer: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        assigned: {
          select: {
            email: true,
          },
        },
      },
    });

    if (pendingDeliveries && pendingDeliveries.length > 0) {
      pendingDeliveries.forEach(async (delivery) => {
        if (hoursUntilXDate(delivery.start_date) === 1) {
          const managerUsers = await managerUsersArray();

          await prisma.notifications.create({
            data: {
              message: `There is a delivery scheduled in one hour with ${delivery.customer.first_name} ${delivery.customer.last_name}`,
              type_id: 3,
              user_id: delivery.assigned_to,
              notification_for_managers: true,
            },
          });

          sendTo(delivery.assigned.email, 'notifications');

          if (managerUsers && managerUsers.length > 0) {
            managerUsers.forEach((user) => {
              sendTo(user.email, 'notifications');
            });
          }
        } else if (minutesSinceXDate(delivery.end_date) === 30) {
          const managerUsers = await managerUsersArray();

          await prisma.notifications.create({
            data: {
              message: `The delivery with ${delivery.customer.first_name} ${delivery.customer.last_name} has expired`,
              type_id: 5,
              user_id: delivery.assigned_to,
              notification_for_managers: true,
            },
          });

          sendTo(delivery.assigned.email, 'notifications');

          if (managerUsers && managerUsers.length > 0) {
            managerUsers.forEach((user) => {
              sendTo(user.email, 'notifications');
            });
          }
        }
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.log(error);
  }
}
