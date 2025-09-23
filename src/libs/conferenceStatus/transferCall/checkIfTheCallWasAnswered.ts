import { transferCall } from './transferCall';
import { prisma } from '../../prisma/prisma';
import { io, isConnected, sendTo } from '../../../websocketServer';
import { missedCallFromUnknowCustomer } from './missedCallFromUnknowCustomer/missedCallFromUnknowCustomer';

export async function checkIfTheCallWasAnswered(
  customerNumber: string,
  conferenceSid: string,
  conferenceName: string,
  conferenceParticipants: string[],
  callBackup?: boolean,
  callSendedToSalesRepWeb?: boolean,
  bdcEmail?: string,
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

      const conferenceCustomerData = await prisma.client_calls.findUnique({
        where: {
          call_sid: conferenceSid,
        },
        select: {
          client_id: true,
        },
      });

      if (!answered?.answered) {
        io.emit('update_data', 'transferCompleted', { conferenceName });

        if (callSendedToSalesRepWeb && bdcEmail && isConnected(bdcEmail)) {
          console.log('conferenceName 1: ', conferenceName);

          checkIfTheCallWasAnswered(
            customerNumber,
            conferenceSid,
            conferenceName,
            conferenceParticipants,
          );

          console.log('conferenceName 2: ', conferenceName);

          sendTo(bdcEmail, 'joinConference', {
            conferenceName,
            conferenceSid,
            phoneNumber: customerNumber,
          });
        } else {
          await transferCall(customerNumber, conferenceSid, conferenceName, callBackup);
        }
      }

      if (conferenceCustomerData && !conferenceCustomerData.client_id && !answered?.answered) {
        await missedCallFromUnknowCustomer(conferenceSid);
      }
    }, 12000);
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
