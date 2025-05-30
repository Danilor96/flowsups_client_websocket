import { prisma } from '../prisma/prisma';
import { startOfToday, endOfToday } from 'date-fns';

export async function entryHandler(user: string) {
  try {
    const todayAccess = await prisma.system_accesses.findFirst({
      where: {
        Users: { email: user },
        entry_date: {
          gte: startOfToday(),
          lt: endOfToday(),
        },
      },
    });

    if (!todayAccess) {
      await prisma.system_accesses.create({
        data: {
          entry_date: new Date(),
          Users: {
            connect: { email: user },
          },
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
}

export async function exitHandler(user: string) {
  try {
    const existTodayAccess = await prisma.users.findUnique({
      where: {
        email: user,
        System_accesses: {
          some: {
            entry_date: {
              gte: startOfToday(),
              lt: endOfToday(),
            },
          },
        },
      },
      select: {
        System_accesses: {
          select: {
            id: true,
          },
        },
      },
    });

    if (existTodayAccess && existTodayAccess.System_accesses.length > 0) {
      const todayExit = await prisma.system_accesses.update({
        where: {
          id: existTodayAccess.System_accesses[0].id,
        },
        data: {
          exit_date: new Date(),
        },
      });
    } else {
      const lastAccess = await prisma.users.findUnique({
        where: {
          email: user,
        },
        select: {
          System_accesses: {
            orderBy: {
              entry_date: 'desc',
            },
            take: 1,
          },
        },
      });

      if (lastAccess && lastAccess.System_accesses.length > 0) {
        await prisma.system_accesses.update({
          where: {
            id: lastAccess.System_accesses[0].id,
          },
          data: {
            exit_date: new Date(),
          },
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
}
