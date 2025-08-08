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
      for (let i = 0; i < lateTasks.length; i++) {
        const task = lateTasks[i];

        //-------------------------------------------------------
        console.log(`Tareas tardes: ${lateTasks.length}`);

        const notification = await prisma.notifications.create({
          data: {
            message: `Task '${task.description}' has expired`,
            user_id: task.assigned_to,
            // customer_id: customerId,
            type_id: 1,
            // appointment_id: appointmentId,
            created_at: new Date(),
            is_read: false,
            is_deleted: false,
            notification_for_managers: false,
            // unregistered_customer_id: unregisteredCustomerId,
          },
        });

        //-------------------------------------------------------

        // await createNotification({
        //   message: `Task '${task.description}' has expired`,
        //   assignedToId: task.assigned_to ? [task.assigned_to] : [],
        //   notificationType: {
        //     general: true,
        //   },
        //   eventTypeId: 20,
        // });
      }
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
