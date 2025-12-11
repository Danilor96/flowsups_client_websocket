import { client } from '../../../../websocketServer';
import { callCreation } from '../transferCall';
import { prisma } from '../../../prisma/prisma';

export async function missedCallFromUnknowCustomer({
  conferenceSid,
  conferenceName,
  customerPhone,
}: {
  conferenceSid: string;
  conferenceName: string;
  customerPhone: string;
}) {
  try {
    const conferenceInProgess = await client.conferences(conferenceSid).fetch();
    const participantsList = await conferenceInProgess.participants().list();

    if (conferenceInProgess.status !== 'completed' && participantsList.length > 0) {
      const businessSettings = await prisma.voice_and_sms.findFirst({
        select: { forward_incoming_calls_to: true },
      });

      if (businessSettings?.forward_incoming_calls_to) {
        await callCreation(
          conferenceSid,
          conferenceName,
          businessSettings?.forward_incoming_calls_to,
          customerPhone,
          true,
        );
      } else {
        await client.conferences(conferenceSid).update({
          status: 'completed',
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
}
