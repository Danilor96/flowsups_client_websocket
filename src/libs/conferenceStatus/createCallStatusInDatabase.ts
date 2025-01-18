import { prisma } from '../prisma/prisma';

// create call status function

export const createCallStatusInDatabase = async (
  customerId?: number,
  userId?: number,
  phoneNumber?: string,
  callSid?: string,
) => {
  if (callSid) {
    await prisma.client_calls.create({
      data: {
        client_id: customerId ? customerId : null,
        seller_id: userId ? userId : null,
        phone_number: phoneNumber ? phoneNumber : null,
        call_sid: callSid,
        call_date: new Date(),
        call_duration: '0',
        call_status_id: 6,
        call_direction_id: 1,
      },
    });
  }
};
