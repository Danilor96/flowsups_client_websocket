import { ParticipantInstance } from 'twilio/lib/rest/api/v2010/account/conference/participant';
import { client, io } from '../../../websocketServer';
import { prisma } from '../../prisma/prisma';

const websocketPublicUrl = process.env.TWILIO_WEBSOCKET_URL;
const accountPhoneNumber: string = process.env.TWILIO_PHONE_NUMBER || '';

export async function transferCall(
  customerNumber: string,
  conferenceSid: string,
  conferenceName: string,
  callBackup?: boolean,
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
        await callCreation(
          conferenceSid,
          conferenceName,
          salesrepnum,
          customerNumber,
          undefined,
          callBackup,
        );
      }

      if (bdcnum) {
        await callCreation(
          conferenceSid,
          conferenceName,
          bdcnum,
          customerNumber,
          undefined,
          callBackup,
        );
      }

      if (!bdcnum && !salesrepnum) {
        await voiceSystemBackupNumber(
          conferenceSid,
          conferenceName,
          customerNumber,
          participantsList,
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
}

export async function callCreation(
  conferenceSid: string,
  conferenceName: string,
  phoneNumber: string,
  customerPhone: string,
  backupCalled?: boolean,
  callBackup?: boolean,
) {
  await client
    .conferences(conferenceSid)
    .participants.create({
      from: accountPhoneNumber,
      to: phoneNumber.includes('+58') ? phoneNumber : `+1${phoneNumber}`,
      statusCallback: `${websocketPublicUrl}/getCurrentConferenceCallStatus/${conferenceName}.${conferenceSid}?customerPhone=${customerPhone}${
        backupCalled ? '&backupCalled=true' : ''
      }${callBackup ? '&callBackup=true' : ''}`,
      statusCallbackEvent: ['answered', 'completed', 'initiated', 'ringing'],
      statusCallbackMethod: 'POST',
      endConferenceOnExit: true,
      timeout: 12,
    })
    .catch((reason) => {
      console.log(reason);
    });
}

export async function voiceSystemBackupNumber(
  conferenceSid: string,
  conferenceName: string,
  customerPhone: string,
  participantInstance: ParticipantInstance[],
) {
  io.emit('update_data', 'lastParticipant', {
    userEmail: '',
    inProgressConferenceName: conferenceName,
    conferenceSid: conferenceSid,
  });

  const hasParticipants = participantInstance.length > 1;

  // await hangUpConference();
  //deberia ser (multi tenant)
  const businessSettings = await prisma.voice_and_sms.findFirst({
    select: { forward_incoming_calls_to: true },
  });

  if (!hasParticipants && businessSettings?.forward_incoming_calls_to) {
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
