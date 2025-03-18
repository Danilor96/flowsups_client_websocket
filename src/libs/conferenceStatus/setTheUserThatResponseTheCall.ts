import { ParticipantInstance } from 'twilio/lib/rest/api/v2010/account/conference/participant';
import { client } from '../../websocketServer';
import { prisma } from '../prisma/prisma';

export async function setTheUserThatResponseTheCall(
  conferenceSid: string,
  participants: ParticipantInstance[],
) {
  try {
    const noCustomerPartcipants = participants.filter(
      (participant, index) => index !== participants.length - 1,
    );

    if (noCustomerPartcipants && noCustomerPartcipants.length > 0) {
      for (let i = 0; i < noCustomerPartcipants.length; i++) {
        const participant = noCustomerPartcipants[i];

        const callSid = participant.callSid;

        const callInfo = await client.calls(callSid).fetch();

        const userId = await prisma.users.findFirst({
          where: {
            OR: [
              {
                email: callInfo.fromFormatted,
              },
              {
                mobile_phone: callInfo.to.slice(-10),
              },
            ],
          },
          select: {
            id: true,
          },
        });

        const call = await prisma.client_calls.findUnique({
          where: {
            call_sid: conferenceSid,
          },
          select: {
            user_id: true,
          },
        });

        if (userId && userId.id && call && !call.user_id.includes(userId.id) && conferenceSid) {
          await prisma.client_calls.update({
            where: {
              call_sid: conferenceSid,
            },
            data: {
              user_id: {
                push: userId.id,
              },
            },
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}
