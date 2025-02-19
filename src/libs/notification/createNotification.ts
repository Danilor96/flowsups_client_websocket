import { prisma } from '../prisma/prisma';

export async function createNotification({
  notificationType,
  assignedToId,
  customerId,
  message,
  appointmentId,
  notificationsForManagers,
  exclusiveManagerNotification,
  unregisteredCustomerId,
}: {
  notificationType: {
    general?: boolean;
    appointment?: boolean;
    inventory?: boolean;
    customer?: boolean;
    warning?: boolean;
  };
  assignedToId?: number | null;
  customerId?: number;
  message: string;
  appointmentId?: number;
  notificationsForManagers?: boolean;
  exclusiveManagerNotification?: boolean;
  unregisteredCustomerId?: number;
}) {
  try {
    const { general, appointment, customer, inventory, warning } = notificationType;

    const managerUsersIds: number[] = [];

    let notiType = 1;

    if (appointment) notiType = 2;
    if (inventory) notiType = 3;
    if (customer) notiType = 4;
    if (warning) notiType = 5;

    if (notificationsForManagers) {
      const managerUsers = await prisma.users.findMany({
        where: {
          user_has: {
            some: {
              role_id: {
                in: [1, 2, 3, 4],
              },
            },
          },
        },
      });

      for (let i = 0; i < managerUsers.length; i++) {
        const user = managerUsers[i];

        const userId = user.id;

        managerUsersIds.push(userId);

        const notification = await prisma.notifications.create({
          data: {
            message: message,
            user_id: userId,
            customer_id: customerId,
            type_id: notiType,
            appointment_id: appointmentId,
            created_at: new Date(),
            is_read: false,
            is_deleted: false,
            notification_for_managers: false,
            unregistered_customer_id: unregisteredCustomerId,
          },
        });
      }

      if (exclusiveManagerNotification) return;
    }

    if (assignedToId && !managerUsersIds.includes(assignedToId)) {
      const notification = await prisma.notifications.create({
        data: {
          message: message,
          user_id: assignedToId,
          customer_id: customerId,
          type_id: notiType,
          appointment_id: appointmentId,
          created_at: new Date(),
          is_read: false,
          is_deleted: false,
          notification_for_managers: false,
          unregistered_customer_id: unregisteredCustomerId,
        },
      });
    }
  } catch (error) {
    console.log(error);
  }
}
