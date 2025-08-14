import { differenceInDays, differenceInMinutes, endOfToday } from 'date-fns';
import { prisma } from '../prisma/prisma';
import { formatPhoneNumber } from '../formats/phoneNumber';
import { io } from '../../websocketServer';
import { createNotification } from '../notification/createNotification';

export async function assignUserFromRoundRobin(
  customerPhoneNumber: string,
  customerAlreadyRegistered?: boolean,
) {
  try {
    // get the users from round robin list that are ready for leads

    const activeAndReadyForLeadRoundRobinUsers = await prisma.users.findMany({
      where: {
        round_robin: true,
        ready_for_leads: true,
      },
      select: {
        id: true,
        round_robin_order: true,
      },
      orderBy: {
        round_robin_order: 'asc',
      },
    });

    // get round robin configuration

    const roundRobinSettings = await prisma.round_robin.findFirst();

    // get limit for assign/reassign leads in days number

    const limitRoundRobinAssignment = roundRobinSettings
      ? roundRobinSettings.days_until_avoid
      : null;

    // get task assignation configuration

    const createTaskWithUserAssignation = roundRobinSettings
      ? roundRobinSettings.create_task_after_assign_new_lead
      : undefined;

    // variable to retrieve user email

    let userEmail = '';

    // check if there is a limit in days (from customer creation date):
    // - if the customer is registered and the days since creation is greater
    // than the limit then don't assign/reassign user from round robin
    // - if the customer isn't registered then ignore this configuration

    if (limitRoundRobinAssignment && customerAlreadyRegistered) {
      const customerCreationDate = await prisma.clients.findUnique({
        where: {
          mobile_phone: customerPhoneNumber,
        },
        select: {
          created_at: true,
        },
      });

      if (customerCreationDate) {
        const difference = differenceInDays(customerCreationDate.created_at, new Date());

        if (difference > limitRoundRobinAssignment) return userEmail;
      }
    }

    // check if a configuration is set:
    // - if there is a configuration then keep forward
    // - if there is not a configuration then don't assign/reassign users from round robin

    if (roundRobinSettings && roundRobinSettings.ready_for_leads) {
      // variable to set the first user in the order of the round robin list

      let firstInRoundRobinOrder: {
        id: number;
        round_robin_order: number | null;
      } | null = null;

      // check if there are users in the round robin users list:
      // - if there is at least one user in round robin list then picks the first user in the list and
      // assign it to the previous initialized variable
      // - if there isn't at least an user then keep the previous initialized variable as null (this will
      // cause that the main function don't assign/reassign users from round robin)

      if (activeAndReadyForLeadRoundRobinUsers && activeAndReadyForLeadRoundRobinUsers.length > 0) {
        firstInRoundRobinOrder = activeAndReadyForLeadRoundRobinUsers.reduce((prev, current) => {
          if (current.round_robin_order === null) return prev;

          if (prev.round_robin_order === null) return prev;

          return prev.round_robin_order < current.round_robin_order ? prev : current;
        });
      }

      // check if the current requested customer is a registered customer or not:
      // - if the customer isn't registered then assigns the user to awaiting unknown customer table
      // - if the customer is registered then assigns the user to regular customer table

      if (!customerAlreadyRegistered && firstInRoundRobinOrder) {
        const assignUserToUnknowCustomer = await prisma.awaiting_unknow_client.upsert({
          where: {
            mobile_phone_number: customerPhoneNumber,
          },
          update: {
            user_id: firstInRoundRobinOrder.id,
          },
          create: {
            user_id: firstInRoundRobinOrder.id,
          },
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        });

        userEmail = assignUserToUnknowCustomer.user?.email ?? '';

        if (createTaskWithUserAssignation && userEmail) {
          await createTaskWithNotification(
            customerPhoneNumber,
            firstInRoundRobinOrder.id,
            userEmail,
            undefined,
            assignUserToUnknowCustomer?.id,
          );
        }
      } else if (firstInRoundRobinOrder) {
        const registeredCustomerId = await prisma.clients.findFirst({
          where: {
            OR: [{ mobile_phone: customerPhoneNumber }, { home_phone: customerPhoneNumber }],
          },
          select: {
            id: true,
          },
        });

        if (registeredCustomerId) {
          const assignUserToRegisteredCustomer = await prisma.clients.update({
            where: {
              id: registeredCustomerId.id,
            },
            data: {
              seller_id: firstInRoundRobinOrder.id,
              Leads: {
                updateMany: {
                  where: {
                    has_ended: false,
                  },
                  data: {
                    sales_rep_id: registeredCustomerId.id,
                  },
                },
              },
            },
            select: {
              id: true,
              seller: {
                select: {
                  email: true,
                },
              },
            },
          });

          userEmail = assignUserToRegisteredCustomer.seller?.email ?? '';

          if (createTaskWithUserAssignation && userEmail) {
            await createTaskWithNotification(
              customerPhoneNumber,
              firstInRoundRobinOrder.id,
              userEmail,
              registeredCustomerId.id,
            );
          }
        }
      }

      // reassign new orders

      if (firstInRoundRobinOrder) {
        const firstUserIndex = activeAndReadyForLeadRoundRobinUsers.findIndex(
          (user) => user.round_robin_order === firstInRoundRobinOrder.round_robin_order,
        );

        const newArray = [...activeAndReadyForLeadRoundRobinUsers];

        const removeAndmoveFromFirstToLast = newArray.splice(firstUserIndex, 1)[0];

        newArray.push(removeAndmoveFromFirstToLast);

        newArray.forEach((user, index) => {
          user.round_robin_order = index + 1;
        });

        await prisma.$transaction(
          newArray.map((user) =>
            prisma.users.update({
              where: {
                id: user.id,
              },
              data: {
                round_robin_order: user.round_robin_order,
              },
            }),
          ),
        );
      }
    }

    return userEmail;
  } catch (error) {
    console.log(error);
  }
}

async function createTaskWithNotification(
  phoneNumber: string,
  roundRobinUserId: number,
  userEmail: string,
  registeredCustomerId?: number,
  unregisteredCustomerId?: number,
) {
  await prisma.tasks.create({
    data: {
      deadline: endOfToday(),
      description: `A new lead is now assigned to you: ${formatPhoneNumber(
        phoneNumber,
      )}. Please log this lead in the system as soon as possible.`,
      title: 'Lead Assigned',
      created_by: 1,
      status: 1,
      assigned_to: roundRobinUserId,
    },
  });

  await createNotification({
    message: `A new lead is now assigned to you: ${formatPhoneNumber(phoneNumber)}.`,
    notificationType: {
      warning: true,
    },
    assignedToId: [roundRobinUserId],
    customerId: registeredCustomerId,
    unregisteredCustomerId: unregisteredCustomerId,
  });

  io.to(userEmail).emit('update_data', 'tasks');
  io.to(userEmail).emit('update_data', 'notifications');
}

const timeSpan = [5, 10, 15, 30, 60, 90, 120];

export async function checkNotDispositionedLeads() {
  try {
    const roundRobinSettings = await prisma.round_robin.findFirst();

    if (roundRobinSettings) {
      if (roundRobinSettings.automatic_reassign_leads && roundRobinSettings.span_time_id) {
        const unregisteredCustomer = await prisma.awaiting_unknow_client.findMany();

        if (unregisteredCustomer && unregisteredCustomer.length > 0) {
          for (let i = 0; i < unregisteredCustomer.length; i++) {
            const customer = unregisteredCustomer[i];

            let difference = 0;

            const timeSpanSelected = roundRobinSettings.span_time_id;

            if (customer.last_activity) {
              difference = differenceInMinutes(customer.last_activity, new Date());
            } else {
              difference = differenceInMinutes(customer.created_at, new Date());
            }

            if (
              Math.abs(difference) > timeSpan[timeSpanSelected - 1] &&
              customer.mobile_phone_number
            ) {
              await assignUserFromRoundRobin(customer.mobile_phone_number);
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}
