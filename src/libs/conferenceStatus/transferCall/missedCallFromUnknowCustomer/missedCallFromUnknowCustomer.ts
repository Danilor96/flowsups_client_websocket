import twilio from 'twilio';
import { client } from '../../../../websocketServer';

export async function missedCallFromUnknowCustomer(conferenceSid: string) {
  try {
    const conferenceInProgess = await client.conferences(conferenceSid).fetch();
    const participantsList = await conferenceInProgess.participants().list();

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    if (conferenceInProgess.status !== 'completed' && participantsList.length > 0) {
      await conferenceInProgess.update({
        status: 'completed',
      });
    }
  } catch (error) {
    console.log(error);
  }
}
