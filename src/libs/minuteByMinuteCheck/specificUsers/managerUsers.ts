import { prisma } from '../../prisma/prisma';

export const managerUsersArray = async () => {
  const managerUsers = await prisma.users.findMany({
    where: {
      Roles: {
        some: {
          OR: [
            {
              id: 1,
            },
            {
              id: 2,
            },
            {
              id: 3,
            },
            {
              id: 4,
            },
          ],
        },
      },
    },
  });

  return managerUsers;
};
