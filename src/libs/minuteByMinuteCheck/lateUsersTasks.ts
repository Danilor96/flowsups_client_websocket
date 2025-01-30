import { prisma } from '../prisma/prisma';
import { io, sendTo } from '../../websocketServer';
import { managerUsersArray } from './specificUsers/managerUsers';

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

          await prisma.notifications.create({
            data: {
              message: `${user.name} ${user.last_name} has already reached 15 or more missed tasks`,
              type_id: 5,
              notification_for_managers: true,
            },
          });

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
