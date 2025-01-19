import twilio from 'twilio';
import { checkCustomerMadeCalls } from './checkCustomerMadeCalls';
import { Response } from 'express';
import { RandomNameGenerator } from './randomNameGenerator';
import { deleteConferenceName } from '../conferenceStatus/deleteConferenceName';

const nextPublicUrl = process.env.NEXT_API_URL;
const websocketPublicUrl = process.env.TWILIO_WEBSOCKET_URL;

interface IncomingCallData {
  from: any;
  to: any;
  res: Response;
}

export async function handlingIncomingCall({ from, to, res }: IncomingCallData) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const dial = twiml.dial();

  try {
    const conferenceName = await RandomNameGenerator();

    // check if the current caller has an active ban
    const callPermission = await checkCustomerMadeCalls(from.slice(-10));

    console.log('permission: ', callPermission);

    if (callPermission) {
      if (from && to && typeof from === 'string' && typeof to === 'string') {
        // create conference room

        const conference = dial.conference(
          {
            startConferenceOnEnter: true,
            endConferenceOnExit: true,
            waitUrl: `${nextPublicUrl}/api/waitConferenceUrl/${conferenceName}`,
            waitMethod: 'POST',
            statusCallback: `${websocketPublicUrl}/getCurrentConferenceStatus/${conferenceName}`,
            statusCallbackEvent: ['start', 'announcement', 'end', 'leave', 'join'],
            statusCallbackMethod: 'POST',
          },
          conferenceName,
        ).conference;

        res.type('text/xml');
        res.send(twiml.toString());
      }
    } else if (
      !callPermission &&
      from &&
      to &&
      typeof from === 'string' &&
      typeof to === 'string'
    ) {
      await deleteConferenceName(conferenceName);

      twiml.say(
        'You have an active suspension due to several call attempts. Please wait ten minutes to try again',
      );

      twiml.hangup();

      res.type('text/xml');
      res.send(twiml.toString());
    }
  } catch (error) {
    console.log(error);

    twiml.say('Thanks for using Flowsups. Good Bye!');

    res.type('text/xml');
    res.send(twiml.toString());
  }
}
