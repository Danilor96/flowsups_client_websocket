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
  // const conferenceInProgess = await client.conferences(conferenceSid).fetch();
  // const participantsList = await conferenceInProgess.participants().list();

  try {
    setTimeout(async () => {
      const updatedCall = await prisma.client_calls.updateMany({
        where: {
          call_sid: conferenceSid,
          isBlockedForAnswering: false,
        },
        data: {
          isBlockedForAnswering: true,
        },
      });

      if (updatedCall.count === 0) {
        return;
      }

      const conferenceCustomerData = await prisma.client_calls.findUnique({
        where: {
          call_sid: conferenceSid,
        },
        select: {
          client_id: true,
        },
      });

      const isCustomerRegistered = conferenceCustomerData && conferenceCustomerData.client_id;

      io.emit('update_data', 'transferCompleted', { conferenceName });

      if (callSendedToSalesRepWeb && bdcEmail && isConnected(bdcEmail)) {
        await prisma.client_calls.updateMany({
          where: {
            call_sid: conferenceSid,
            isBlockedForAnswering: true,
          },
          data: {
            isBlockedForAnswering: false,
          },
        });

        checkIfTheCallWasAnswered(
          customerNumber,
          conferenceSid,
          conferenceName,
          conferenceParticipants,
        );

        sendTo(bdcEmail, 'joinConference', {
          conferenceName,
          conferenceSid,
          phoneNumber: customerNumber,
        });
      } else if (isCustomerRegistered) {
        await transferCall(customerNumber, conferenceSid, conferenceName, callBackup);
      }

      if (!isCustomerRegistered) {
        await missedCallFromUnknowCustomer({
          conferenceSid,
          conferenceName,
          customerPhone: customerNumber,
        });
      }
    }, 20000);
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
