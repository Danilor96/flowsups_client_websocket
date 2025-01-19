import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../prisma/prisma';

export async function RandomNameGenerator() {
  const conferenceNamePrefix = 'conference_';

  let uniqueId = uuidv4();

  let conferenceExists = true;

  while (conferenceExists) {
    const conference = await prisma.conferences_names.findUnique({
      where: {
        conference_name: uniqueId,
      },
    });

    conferenceExists = !!conference;

    if (!conferenceExists) {
      break;
    }

    uniqueId = uuidv4();
  }

  const newConference = await prisma.conferences_names.create({
    data: {
      conference_name: conferenceNamePrefix + uniqueId,
    },
  });

  return newConference.conference_name;
}
