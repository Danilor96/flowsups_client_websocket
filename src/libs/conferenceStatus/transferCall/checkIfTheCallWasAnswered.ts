import { transferCall } from './transferCall';
import { prisma } from '../../prisma/prisma';
import { io } from '../../../websocketServer';

export async function checkIfTheCallWasAnswered(
  customerNumber: string,
  conferenceSid: string,
  conferenceName: string,
) {
  try {
    setTimeout(async () => {
      const answered = await prisma.conferences_names.findUnique({
        where: {
          conference_name: conferenceName,
        },
        select: {
          answered: true,
        },
      });

      if (!answered?.answered) {
        io.emit('update_data', 'lastParticipant', {
          userEmail: '',
          inProgressConferenceName: conferenceName,
        });

        await transferCall(customerNumber, conferenceSid, conferenceName);
      }
    }, 8000);
  } catch (error) {
    console.log(error);
  }
}

export async function setTheCallAsAnswered(conferenName: string) {
  try {
    const call = await prisma.conferences_names.update({
      where: {
        conference_name: conferenName,
      },
      data: {
        answered: true,
      },
    });
  } catch (error) {
    console.log(error);
  }
}
