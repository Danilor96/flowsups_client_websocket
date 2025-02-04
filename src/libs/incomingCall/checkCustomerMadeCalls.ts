import { subMinutes, addMinutes, endOfToday } from 'date-fns';
import { prisma } from '../prisma/prisma';

// check how many times a customer made a call

export const checkCustomerMadeCalls = async (phoneNumber: string) => {
  // check if the customer has an active suspension

  const todayIsos = new Date().toISOString();

  const today = new Date(todayIsos);

  const activeSuspension = await prisma.suspension.findFirst({
    where: {
      mobile_phone: phoneNumber,
      end_suspension_date: {
        gt: today,
      },
    },
  });

  if (activeSuspension) {
    return false;
  }

  // Check if the customer has any calls in the last 10 minutes

  const tenMinutesAgo = subMinutes(today, 10);

  const incomingCalls = await prisma.client_calls.count({
    where: {
      call_direction_id: 1,
      call_date: {
        gte: tenMinutesAgo,
      },
      phone_number: phoneNumber,
    },
  });

  if (incomingCalls >= 5) {
    await prisma.suspension.create({
      data: {
        mobile_phone: phoneNumber,
        start_suspension_date: today,
        end_suspension_date: addMinutes(today, 10),
      },
    });

    return false;
  }

  return true;
};
