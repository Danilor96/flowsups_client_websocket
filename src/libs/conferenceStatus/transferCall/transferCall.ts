import { client } from '../../../websocketServer';
import { prisma } from '../../prisma/prisma';

const websocketPublicUrl = process.env.TWILIO_WEBSOCKET_URL;
const accountPhoneNumber: string = process.env.TWILIO_PHONE_NUMBER || '';

export async function transferCall(
  customerNumber: string,
  conferenceSid: string,
  conferenceName: string,
) {
  try {
    const conferenceInProgess = await client.conferences(conferenceSid).fetch();
    const participantsList = await conferenceInProgess.participants().list();

    const assignedUsers = await prisma.clients.findUnique({
      where: {
        mobile_phone: customerNumber,
      },
      select: {
        seller: {
          select: {
            mobile_phone: true,
          },
        },
        bdc: {
          select: {
            mobile_phone: true,
          },
        },
      },
    });

    const salesrepnum = assignedUsers?.seller?.mobile_phone;
    const bdcnum = assignedUsers?.bdc?.mobile_phone;

    if (conferenceInProgess.status !== 'completed' && participantsList.length > 0) {
      if (salesrepnum) {
        await client
          .conferences(conferenceSid)
          .participants.create({
            from: accountPhoneNumber,
            to: `+1${salesrepnum}`,
            statusCallback: `${websocketPublicUrl}/getCurrentConferenceCallStatus/${conferenceName}`,
            statusCallbackEvent: ['answered', 'completed', 'initiated', 'ringing'],
            statusCallbackMethod: 'POST',
            endConferenceOnExit: true,
            timeout: 7,
          })
          .catch((reason) => {
            console.log(reason);
          });
      } else if (bdcnum) {
        await client
          .conferences(conferenceSid)
          .participants.create({
            from: accountPhoneNumber,
            to: `+1${bdcnum}`,
            statusCallback: `${websocketPublicUrl}/getCurrentConferenceCallStatus/${conferenceName}`,
            statusCallbackEvent: ['answered', 'completed', 'initiated', 'ringing'],
            statusCallbackMethod: 'POST',
            endConferenceOnExit: true,
            timeout: 7,
          })
          .catch((reason) => {
            console.log(reason);
          });
      }
    }
  } catch (error) {
    console.log(error);
  }
}
