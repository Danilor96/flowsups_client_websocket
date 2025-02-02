import { prisma } from '../prisma/prisma';
import { io, sendTo } from '../../websocketServer';
import { managerUsersArray } from './specificUsers/managerUsers';
import { hoursUntilXDate } from './datesDifferences/hoursUntilXDate';
import { minutesSinceXDate } from './datesDifferences/minutesSinceXDate';

export async function pendingDeliveries() {
  try {
    const pendingDeliveries = await prisma.vehicle_delivery.findMany({
      include: {
        Clients: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        Users_Vehicle_delivery_assigned_toToUsers: {
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
              message: `There is a delivery scheduled in one hour with ${delivery.Clients.first_name} ${delivery.Clients.last_name}`,
              type_id: 3,
              user_id: delivery.assigned_to,
              notification_for_managers: true,
            },
          });

          io.to(sendTo(delivery.Users_Vehicle_delivery_assigned_toToUsers.email)).emit(
            'update_data',
            'notifications',
          );

          if (managerUsers && managerUsers.length > 0) {
            managerUsers.forEach((user) => {
              io.to(sendTo(user.email)).emit('update_data', 'notifications');
            });
          }
        } else if (minutesSinceXDate(delivery.end_date) === 30) {
          const managerUsers = await managerUsersArray();

          await prisma.notifications.create({
            data: {
              message: `The delivery with ${delivery.Clients.first_name} ${delivery.Clients.last_name} has expired`,
              type_id: 5,
              user_id: delivery.assigned_to,
              notification_for_managers: true,
            },
          });

          io.to(sendTo(delivery.Users_Vehicle_delivery_assigned_toToUsers.email)).emit(
            'update_data',
            'notifications',
          );

          if (managerUsers && managerUsers.length > 0) {
            managerUsers.forEach((user) => {
              io.to(sendTo(user.email)).emit('update_data', 'notifications');
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
