import { prisma } from '../prisma/prisma';

export async function assignUserFromRoundRobin(
  customerMobilePhone: string,
  customerAlreadyRegistered?: boolean,
) {
  try {
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

    let firstInRoundRobinOrder: {
      id: number;
      round_robin_order: number | null;
    } | null = null;

    if (activeAndReadyForLeadRoundRobinUsers && activeAndReadyForLeadRoundRobinUsers.length > 0) {
      firstInRoundRobinOrder = activeAndReadyForLeadRoundRobinUsers.reduce((prev, current) => {
        if (current.round_robin_order === null) return prev;

        if (prev.round_robin_order === null) return prev;

        return prev.round_robin_order < current.round_robin_order ? prev : current;
      });
    }

    // variable to retrieve user email

    let userEmail = '';

    if (!customerAlreadyRegistered && firstInRoundRobinOrder) {
      const assignUserToUnknowCustomer = await prisma.awaiting_unknow_client.update({
        where: {
          mobile_phone_number: customerMobilePhone,
        },
        data: {
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
    } else if (firstInRoundRobinOrder) {
      const assignUserToRegisteredCustomer = await prisma.clients.update({
        where: {
          mobile_phone: customerMobilePhone,
        },
        data: {
          seller_id: firstInRoundRobinOrder.id,
        },
        select: {
          seller: {
            select: {
              email: true,
            },
          },
        },
      });

      userEmail = assignUserToRegisteredCustomer.seller?.email ?? '';
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

    return userEmail;
  } catch (error) {
    console.log(error);
  }
}
