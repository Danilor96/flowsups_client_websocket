import { prisma } from '../prisma/prisma';
import { io } from '../../websocketServer';

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
        disconnectOutgoingCall = '1'

        break;

      case 'failed':
        callStatusId = 4;

        console.log('Call ended');

        socketEmit = 'callDisconnect';
        disconnectOutgoingCall = '1'

        break;

      case 'no-answer':
        callStatusId = 3;

        console.log('Call ended');

        socketEmit = 'callDisconnect';
        disconnectOutgoingCall = '1'

        break;

      case 'completed':
        callStatusId = 1;

        console.log('Call ended');

        socketEmit = 'callDisconnect';
        disconnectOutgoingCall = '1'

        break;
    }

    let callExists: {
      id: number;
    } | null = null;

    callExists = await prisma.client_calls.findUnique({
      where: {
        call_sid: parentCallSid,
      },
      select: {
        id: true,
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

    socketEmit &&
      io.emit('update_data', socketEmit, {
        callSid,
        parentCallSid,
        toClientAnswered,
        disconnectOutgoingCall
      });
  } catch (error) {
    console.log(error);
  }
}
