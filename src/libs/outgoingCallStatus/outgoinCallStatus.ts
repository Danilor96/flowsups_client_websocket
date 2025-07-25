import { prisma } from '../prisma/prisma';
import { io, client } from '../../websocketServer';
import { addUserThatHasRespondedToTransferCall } from './addUserThatHasRespondedToTransferCall';
import { ActivityType, salesPointsAssignService } from '../salesPointsServices/salesPointServices';

interface OutogingCallData {
  callStatus: any;
  parentCallSid: any;
  callSid: any;
  callDuration: any;
}

export async function handlingOutgoingCallStatus({
  callStatus,
  parentCallSid,
  callSid,
  callDuration,
}: OutogingCallData) {
  try {
    let callStatusId, socketEmit, toClientAnswered, disconnectOutgoingCall;

    switch (callStatus) {
      case 'initiated':
        callStatusId = 1;
        break;

      case 'ringing':
        break;

      case 'in-progress':
        callStatusId = 6;
        socketEmit = 'callInProgress';
        break;

      case 'busy':
        callStatusId = 2;

        console.log('Call ended');

        socketEmit = 'callDisconnect';
        disconnectOutgoingCall = '1';

        break;

      case 'failed':
        callStatusId = 4;

        console.log('Call ended');

        socketEmit = 'callDisconnect';
        disconnectOutgoingCall = '1';

        break;

      case 'no-answer':
        callStatusId = 3;

        console.log('Call ended');

        socketEmit = 'callDisconnect';
        disconnectOutgoingCall = '1';

        break;

      case 'completed':
        callStatusId = 1;

        console.log('Call ended');

        socketEmit = 'callDisconnect';
        disconnectOutgoingCall = '1';

        break;
    }

    socketEmit &&
      io.emit('update_data', socketEmit, {
        callSid,
        parentCallSid,
        toClientAnswered,
        disconnectOutgoingCall,
      });

    let callExists: {
      id: number;
      user_id?: number[];
    } | null = null;

    callExists = await prisma.client_calls.findUnique({
      where: {
        call_sid: parentCallSid,
      },
      select: {
        id: true,
        user_id: true,
      },
    });

    if (!callExists) {
      callExists = await prisma.client_calls.findUnique({
        where: {
          call_sid: callSid,
        },
        select: {
          id: true,
        },
      });
    }

    if (callExists && callStatusId) {
      const callData = await prisma.client_calls.update({
        where: {
          id: callExists.id,
        },
        data: {
          call_status_id: callStatusId,
          call_duration: callDuration,
        },
      });
    }

    if (callStatus === 'completed') {
      const calls = await client.calls.list({ parentCallSid: callSid });

      // transfered call data

      if (calls && calls.length > 0) {
        const childCallTo = calls[0].to.slice(-10);

        const childCallStatus = calls[0]?.status;

        if (childCallTo && childCallStatus === 'completed') {
          const data = await addUserThatHasRespondedToTransferCall(parentCallSid, childCallTo);

          const usersRelated = await prisma.users.findMany({
            where: {
              OR: [
                {
                  id: {
                    in: callExists?.user_id,
                  },
                },
                {
                  id: {
                    in: data?.user_id,
                  },
                },
              ],
            },
            select: {
              email: true,
            },
          });

          if (usersRelated && usersRelated.length > 0) {
            for (let i = 0; i < usersRelated.length; i++) {
              const el = usersRelated[i];

              io.to(el.email).emit('update_data', 'dailyTotals');
            }
          }
        }
      }
    }
    
    if (callExists && callStatus === 'in-progress') {
      const userIds = callExists.user_id;
      if (userIds && userIds.length > 0) {
        for (const userId of userIds) {
          // logic for assigning points to sellers (sales activity logs)
          salesPointsAssignService({
            userId: userId,
            activityType: ActivityType.CALL_MADE,
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}
