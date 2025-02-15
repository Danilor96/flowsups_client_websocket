import { ParticipantInstance } from 'twilio/lib/rest/api/v2010/account/conference/participant';
import { prisma } from '../prisma/prisma';
import { io, sendTo, client, connectedUsers } from '../../websocketServer';
import { createCallStatusInDatabase } from './createCallStatusInDatabase';
import { deleteConferenceName } from './deleteConferenceName';
import { checkIfCustomerIsInAwaitingTable } from './checkIfCustomerIsInAwaitingTable';
import { addUnknowCustomerToAwatingTable } from './addUnknowCustomerToAwatingTable';
import { assignUserFromRoundRobin } from '../roundRobin/roundRobin';
import { callAnsweredBy } from './callAnsweredBy/callAnsweredBy';

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
        // then checks if is registered in unknow waiting customers table

        if (awaitingCustomer) {
          // if the phone number exists in unknow waiting customers,
          // then checks if that unknow customer is assigned to a user
          // in order to join both in a call

          if (awaitingCustomer.Users?.email) {
            // check if the user is connected

            if (isConnected(awaitingCustomer.Users?.email)) {
              sendTo(awaitingCustomer.Users?.email, 'joinConference', {
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

          const noFirtsUsersCallSid = conferenceParticipansList.map((el) => el.callSid);

          if (firstUserEmail) {
            const awaitingCustomer = await checkIfCustomerIsInAwaitingTable(customerMobilePhone);

            if (awaitingCustomer) callAnsweredBy(customerMobilePhone, firstUserEmail);

            io.emit('update_data', 'lastParticipant', {
              userEmail: firstUserEmail,
              callSidArray: noFirtsUsersCallSid,
              inProgressConferenceName: conferenceName,
              conferenceSid: conferenceSid,
            });
          }

          if (participantMobilePhone && !regexCorreo.test(participantMobilePhone)) {
            const awaitingCustomer = await checkIfCustomerIsInAwaitingTable(customerMobilePhone);

            if (awaitingCustomer)
              callAnsweredBy(customerMobilePhone, undefined, participantMobilePhone.slice(-10));

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
