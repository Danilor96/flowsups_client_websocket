import { ParticipantInstance } from 'twilio/lib/rest/api/v2010/account/conference/participant';
import { prisma } from '../prisma/prisma';
import { io, sendTo, client, connectedUsers } from '../../websocketServer';
import { createCallStatusInDatabase } from './createCallStatusInDatabase';
import { deleteConferenceName } from './deleteConferenceName';
import { checkIfCustomerIsInAwaitingTable } from './checkIfCustomerIsInAwaitingTable';
import { addUnknowCustomerToAwatingTable } from './addUnknowCustomerToAwatingTable';
import { assignUserFromRoundRobin } from '../roundRobin/roundRobin';
import { callAnsweredBy } from './callAnsweredBy/callAnsweredBy';
import {
  checkIfTheCallWasAnswered,
  setTheCallAsAnswered,
} from './transferCall/checkIfTheCallWasAnswered';
import { setTheUserThatResponseTheCall } from './setTheUserThatResponseTheCall';
import { makeTaskAfterMissingACall } from './makeTaskAfterMissingACall';
import { ActivityType, salesPointsAssignService } from '../salesPointsServices/salesPointServices';

interface ConferenceData {
  conferenceSid: any;
  conferenceName: any;
  conferenceStatus: any;
  sequence: any;
  eventTimestamp: any;
  callSid: any;
  conferenceParticipansList: ParticipantInstance[];
}

export async function handlingConferenceStatus({
  conferenceSid,
  conferenceName,
  conferenceStatus,
  sequence,
  eventTimestamp,
  callSid,
  conferenceParticipansList,
}: ConferenceData) {
  try {
    const from = callSid ? (await client.calls(callSid).fetch()).from.slice(2) : '';

    // first conference action sequence
    if (sequence === '1') {
      // save the conference attempt in the web data base
      const customerData = await prisma.clients.findFirst({
        where: {
          OR: [
            {
              mobile_phone: from,
            },
            {
              home_phone: from,
            },
          ]
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

      // check if the unknow user exists in unknow awaiting customers table
      // if not save the customer in that table

      const awaitingCustomer = await checkIfCustomerIsInAwaitingTable(from);

      if (!customerData) {
        if (!awaitingCustomer) addUnknowCustomerToAwatingTable(from);
      }

      // advise the web users of the incoming call (conference)

      const usersConnectedArray = Object.values(connectedUsers);

      // function to check if the related web user is connected
      const isConnected = (email: string) => {
        return usersConnectedArray.includes(email);
      };

      // check if the phone number of the incoming call is related to a registered customer
      // and if the customer already has a user assigned

      if (customerData && customerData.seller && customerData.seller.email) {
        //check if the assigned user is connected

        if (isConnected(customerData.seller.email)) {
          sendTo(customerData.seller.email, 'joinConference', {
            conferenceName,
            conferenceSid,
            phoneNumber: from,
          });

          // if the assigned web user is not connected, then reassigns customer to another user
        } else {
          let newAssignedUser = await assignUserFromRoundRobin(from, true);

          let i = 0;

          while (i < usersConnectedArray.length) {
            if (newAssignedUser && isConnected(newAssignedUser)) break;

            newAssignedUser = await assignUserFromRoundRobin(from, true);

            i++;
          }

          if (newAssignedUser) {
            sendTo(newAssignedUser, 'joinConference', {
              conferenceName,
              conferenceSid,
              phoneNumber: from,
            });
          } else {
            // if there is not a new user assigned, then calls to every web users

            io.emit('update_data', 'joinConference', {
              conferenceName,
              conferenceSid,
              phoneNumber: from,
            });
          }
        }
      } else {
        // if the phone number of the incoming call is not registered,
        // then checks if is registered in unknow awaiting customers table

        if (awaitingCustomer) {
          // if the phone number exists in unknow waiting customers,
          // then checks if that unknow customer is assigned to a user
          // in order to join both in a call

          if (awaitingCustomer.user?.email) {
            // check if the user is connected

            if (isConnected(awaitingCustomer.user?.email)) {
              sendTo(awaitingCustomer.user?.email, 'joinConference', {
                conferenceName,
                conferenceSid,
                phoneNumber: from,
              });
            } else {
              // if the assigned web user is not connected, then reassigns customer to another user

              let newAssignedUser = await assignUserFromRoundRobin(from);

              let i = 0;

              while (i < usersConnectedArray.length) {
                if (newAssignedUser && isConnected(newAssignedUser)) break;

                newAssignedUser = await assignUserFromRoundRobin(from);

                i++;
              }

              if (newAssignedUser) {
                sendTo(newAssignedUser, 'joinConference', {
                  conferenceName,
                  conferenceSid,
                  phoneNumber: from,
                });
              } else {
                // if there is not a new user assigned, then calls to every web users

                io.emit('update_data', 'joinConference', {
                  conferenceName,
                  conferenceSid,
                  phoneNumber: from,
                });
              }
            }
          } else {
            // if there is no user assigned, then calls to every web users

            io.emit('update_data', 'joinConference', {
              conferenceName,
              conferenceSid,
              phoneNumber: from,
            });
          }
        } else {
          // if the phone number doesn't exists in unknow awaiting customers,
          // then calls to every web users

          io.emit('update_data', 'joinConference', {
            conferenceName,
            conferenceSid,
            phoneNumber: from,
          });
        }
      }

      const conferenceParticipants = conferenceParticipansList.map((el) => el.callSid);

      checkIfTheCallWasAnswered(from, conferenceSid, conferenceName, conferenceParticipants);
    }

    if (conferenceStatus !== 'conference-end') {
      const conferenceParticipants = await client.conferences(conferenceSid).participants.list();

      const participantsIdentity: string[] = [];

      for (let i = 0; i < conferenceParticipants.length; i++) {
        const participant = conferenceParticipants[i];

        const participantDetail = await client.calls(participant.callSid).fetch();

        participantsIdentity.push(participantDetail.fromFormatted);
      }

      console.log(`participants: ${participantsIdentity.join(' | ')}`);
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
            answered_by_mobile: true,
            answered_by_web: true,
            user_id: true,
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
              call_duration: startConfDate.answered_by_web
                ? callDuration.toString()
                : startConfDate.answered_by_mobile
                ? callDuration.toString()
                : '0',
              call_status_id: 1,
            },
          });

          if (!startConfDate.answered_by_web && !startConfDate.answered_by_mobile) {
            await makeTaskAfterMissingACall(conferenceSid);
          }else {
            
            if(startConfDate.user_id && startConfDate.user_id.length > 0) {
              for (const userId of startConfDate.user_id) {
                // logic for assigning points to sellers (sales activity logs)
                salesPointsAssignService({
                  userId: userId,
                  activityType: ActivityType.CALL_MADE
                })
              }
            }
          }
        }

        // delete conference name from database

        await deleteConferenceName(conferenceName);

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
          await setTheCallAsAnswered(conferenceName);

          const customerMobilePhone = (
            await client
              .calls(conferenceParticipansList[conferenceParticipansList.length - 1].callSid)
              .fetch()
          ).from.slice(-10);

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

          const noFirstUsersCallSid = conferenceParticipansList.map((el) => el.callSid);

          if (firstUserEmail) {
            await prisma.client_calls.update({
              where: {
                call_sid: conferenceSid,
              },
              data: {
                answered_by_web: true,
              },
            });

            const awaitingCustomer = await checkIfCustomerIsInAwaitingTable(customerMobilePhone);

            if (awaitingCustomer) callAnsweredBy(customerMobilePhone, firstUserEmail);

            io.emit('update_data', 'lastParticipant', {
              userEmail: firstUserEmail,
              callSidArray: noFirstUsersCallSid,
              inProgressConferenceName: conferenceName,
              conferenceSid: conferenceSid,
            });
          }

          if (participantMobilePhone && !regexCorreo.test(participantMobilePhone)) {
            await prisma.client_calls.update({
              where: {
                call_sid: conferenceSid,
              },
              data: {
                answered_by_mobile: true,
              },
            });

            const awaitingCustomer = await checkIfCustomerIsInAwaitingTable(customerMobilePhone);

            if (awaitingCustomer) {
              callAnsweredBy(customerMobilePhone, undefined, participantMobilePhone.slice(-10));
            }

            io.emit('update_data', 'lastParticipant', {
              userEmail: '',
              callSidArray: noFirstUsersCallSid,
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
              conferenceSid,
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
              conferenceSid,
            });
          }
        }

        await setTheUserThatResponseTheCall(conferenceSid, conferenceParticipansList);

        break;

      case 'participant-leave':
        const participants = await client.conferences(conferenceSid).participants.list();

        const customerInHold = participants.find((call) => call.hold === true);

        if (conferenceParticipansList.length === 1 && !customerInHold) {
          const currentConference = client.conferences(conferenceSid);

          currentConference.update({ status: 'completed' });
        }
        break;

      case 'conference-start':
        break;
    }
  } catch (error) {
    console.log(error);

    io.emit('update_data', 'callDisconnect', {
      endedConferenceName: conferenceName,
      endedConferenceSid: conferenceSid,
    });
  }
}
