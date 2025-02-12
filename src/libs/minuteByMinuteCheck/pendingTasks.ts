import { prisma } from '../prisma/prisma';
import { io, sendTo } from '../../websocketServer';
import { parseISO } from 'date-fns';

export async function pendingTasks() {
  try {
    const todayIsos = new Date().toISOString();

    const today = parseISO(todayIsos);

    const lateTasks = await prisma.tasks.findMany({
      where: {
        deadline: {
          lt: today,
        },
        status: 1,
      },
    });

    if (lateTasks && lateTasks.length > 0) {
      lateTasks.forEach(async (task) => {
        const notificationTask = await prisma.notifications.create({
          data: {
            message: `Task '${task.description}' has expired`,
            created_at: today,
            user_id: task.assigned_to,
            type_id: 1,
          },
        });
      });
    }

    const tasks = await prisma.tasks.updateMany({
      where: {
        deadline: {
          lt: today,
        },
        status: 1,
      },
      data: {
        status: 4,
      },
    });

    await prisma.$disconnect();

    if (lateTasks && lateTasks.length > 0) {
      io.emit('update_data', 'notifications');

      io.emit('update_data', 'dailyTotals');

      io.emit('update_data', 'tasks');
    }
  } catch (error) {
    console.log(error);
  }
}
