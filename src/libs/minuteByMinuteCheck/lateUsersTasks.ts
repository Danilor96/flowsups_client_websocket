import { prisma } from '../prisma/prisma';
import { io, sendTo } from '../../websocketServer';
import { managerUsersArray } from './specificUsers/managerUsers';
import { createNotification } from '../notification/createNotification';

export async function latesUsersTasks() {
  try {
    const users = await prisma.users.findMany({
      select: {
        name: true,
        last_name: true,
        assigned_task: true,
      },
    });

    if (users && users.length > 0) {
      users.forEach(async (user) => {
        const lateTasks = user.assigned_task.filter((task) => task.status === 4);

        if (lateTasks.length >= 15) {
          const managerUsers = await managerUsersArray();

          await createNotification({
            message: `${user.name} ${user.last_name} has already reached 15 or more missed tasks`,
            notificationType: {
              warning: true,
            },
            notificationsForManagers: true,
            eventTypeId: 15,
          });

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
