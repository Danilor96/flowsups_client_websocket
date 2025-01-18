import { prisma } from '../prisma/prisma';

export async function deleteConferenceName(conferenceName: string) {
  await prisma.conferences_names.delete({
    where: {
      conference_name: conferenceName,
    },
  });
}
