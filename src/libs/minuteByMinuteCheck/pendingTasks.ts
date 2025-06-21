import { prisma } from '../prisma/prisma';
import { io, sendTo } from '../../websocketServer';
import { parseISO } from 'date-fns';
import { createNotification } from '../notification/createNotification';

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
        await createNotification({
          message: `Task '${task.description}' has expired`,
          assignedToId: task.assigned_to ? [task.assigned_to] : [],
          notificationType: {
            general: true,
          },
          eventTypeId: 20,
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
