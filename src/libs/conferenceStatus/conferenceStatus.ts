import { ParticipantInstance } from 'twilio/lib/rest/api/v2010/account/conference/participant';
import { prisma } from '../prisma/prisma';
import { io, connectedUsers, sendTo, client } from '../../websocketServer';
import { createCallStatusInDatabase } from './createCallStatusInDatabase';

interface ConferenceData {
  conferenceSid: any;
  conferenceName: any;
  conferenceStatus: any;
  from: any;
  sequence: any;
  eventTimestamp: any;
  callSid: any;
  conferenceParticipansList: ParticipantInstance[];
  connectedUsers: {
    [id: string]: string;
  };
}

export async function handlingConferenceStatus({
  conferenceSid,
  conferenceName,
  conferenceStatus,
  from,
  sequence,
  eventTimestamp,
  callSid,
  conferenceParticipansList,
  connectedUsers,
}: ConferenceData) {
  try {
    // first conference action sequence
    if (sequence === '1') {
      // save the conference attempt in the web data base
      const customerData = await prisma.clients.findUnique({
        where: {
          mobile_phone: from,
        },
        select: {
          id: true,
          seller: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      createCallStatusInDatabase(customerData?.id, customerData?.seller?.id, from, conferenceSid);

      // advise the web users of the incoming call (conference)

      const usersConnectedArray = Object.values(connectedUsers);

      // function to check if the related web user is connected
      const isConnected = (email: string) => {
        return usersConnectedArray.includes(email);
      };

      // check if the phone number of the incoming call is related to a registered customer

      if (
        customerData &&
        customerData.seller &&
        customerData.seller.email &&
        isConnected(customerData.seller.email)
      ) {
        io.to(sendTo(customerData.seller.email)).emit('update_data', 'joinConference', {
          conferenceName,
          conferenceSid,
        });

        // if there is no relation with the caller or if the
        // related web user is no connected then transfer the call
        // to a round robin user
      } else {
        io.emit('update_data', 'joinConference', {
          conferenceName,
          conferenceSid,
        });
      }
    }

    console.log(`Conference SID: ${conferenceSid}, Status: ${conferenceStatus}.`);

    switch (conferenceStatus) {
      case 'conference-end':
        // set the conference duration
        const startConfDate = await prisma.client_calls.findUnique({
          where: {
            call_sid: conferenceSid,
          },
          select: {
            call_date: true,
          },
        });

        if (startConfDate) {
          const endConfTime = new Date(eventTimestamp).getTime();

          const startConfTime = new Date(startConfDate.call_date).getTime();

          const callDuration = (endConfTime - startConfTime) / 1000;

          await prisma.client_calls.update({
            where: {
              call_sid: conferenceSid,
            },
            data: {
              call_duration: callDuration.toString(),
              call_status_id: 1,
            },
          });
        }

        io.emit('update_data', 'callDisconnect', {
          endedConferenceName: conferenceName,
          endedConferenceSid: conferenceSid,
        });

        break;

      case 'participant-join':
        // check if the first two participants are just the caller customer and
        // the first user that accept the call. Disconnect the rest of the web users from
        // this call

        const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (conferenceParticipansList.length > 1 && sequence >= 2 && sequence <= 3) {
          const firstUserEmail = (
            await client
              .calls(conferenceParticipansList[conferenceParticipansList.length - 2].callSid)
              .fetch()
          ).from.split(':')[1];

          const participantMobilePhone = (
            await client
              .calls(conferenceParticipansList[conferenceParticipansList.length - 2].callSid)
              .fetch()
          ).to;

          const noFirtsUsersCallSid = conferenceParticipansList.map((el) => el.callSid);

          if (firstUserEmail) {
            io.emit('update_data', 'lastParticipant', {
              userEmail: firstUserEmail,
              callSidArray: noFirtsUsersCallSid,
              inProgressConferenceName: conferenceName,
              conferenceSid: conferenceSid,
            });
          }

          if (participantMobilePhone && !regexCorreo.test(participantMobilePhone)) {
            io.emit('update_data', 'lastParticipant', {
              userEmail: '',
              callSidArray: noFirtsUsersCallSid,
              inProgressConferenceName: conferenceName,
              conferenceSid: conferenceSid,
              userMobilePhoneNumber: participantMobilePhone.slice(-10),
            });
          }
        }

        // check if there are a web user that accidentally has joined the conference and
        // then disconnect it/them

        if (conferenceParticipansList.length > 2 && sequence > 3) {
          const webParticipants: string[] = [];
          let firstParticipantEmail = '';

          conferenceParticipansList.forEach(async (participantInfo) => {
            if (
              conferenceParticipansList[conferenceParticipansList.length - 2].callSid !==
              participantInfo.callSid
            ) {
              const participantFetched = await client.calls(participantInfo.callSid).fetch();

              if (regexCorreo.test(participantFetched.from)) {
                webParticipants.push(participantFetched.from);
              }
            } else {
              firstParticipantEmail = (await client.calls(participantInfo.callSid).fetch()).from;
            }
          });

          // if participants are from web disconnect them

          if (webParticipants.length > 0) {
            io.emit('update_data', 'lastParticipant', {
              userEmail: firstParticipantEmail,
              callSidArray: webParticipants,
              inProgressConferenceName: conferenceName,
            });
          }

          // if participants are from a mobile phone then disconnect the first joined web participant from current call
          // (that means that there is a transfer in progress)

          const thirdConferenceParticipant = await client
            .calls(conferenceParticipansList[conferenceParticipansList.length - 3].callSid)
            .fetch();

          if (thirdConferenceParticipant && thirdConferenceParticipant.to) {
            io.emit('update_data', 'lastParticipant', {
              userEmail: '',
              callSidArray: [
                conferenceParticipansList[conferenceParticipansList.length - 2].callSid,
              ],
              inProgressConferenceName: conferenceName,
            });
          }
        }

        break;

      case 'participant-leave':
        console.log('Se fué');
        if (conferenceParticipansList.length === 1) {
          const currentConference = client.conferences(conferenceSid);

          currentConference.update({ status: 'completed' });
        }
        break;

      case 'conference-start':
        break;
    }
  } catch (error) {
    console.log(error);
  }
}
