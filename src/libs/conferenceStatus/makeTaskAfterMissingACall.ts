import { createNotification } from '../notification/createNotification';
import { prisma } from '../prisma/prisma';
import { io } from '../../websocketServer';

export async function makeTaskAfterMissingACall(conferenceSid: string) {
  try {
    const conferenceCustomerData = await prisma.client_calls.findUnique({
      where: {
        call_sid: conferenceSid,
      },
      select: {
        client_call: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            mobile_phone: true,
            seller_id: true,
            bdc_id: true,
          },
        },
      },
    });

    const customer = `${conferenceCustomerData?.client_call?.first_name || ''} ${
      conferenceCustomerData?.client_call?.last_name || ''
    }`;

    const customerMobilePhoneNumber = conferenceCustomerData?.client_call?.mobile_phone
      ? formatPhoneNumber(conferenceCustomerData?.client_call?.mobile_phone)
      : '';

    const task = await prisma.tasks.create({
      data: {
        description: `To call ${customer} ${customerMobilePhoneNumber}`,
        title: 'Missing call',
        deadline: new Date(),
        status: 1,
        created_by: 1,
        assigned_to: conferenceCustomerData?.client_call?.seller_id,
        customer_id: conferenceCustomerData?.client_call?.id,
        notes: {
          create: {
            created_at: new Date(),
            note: `To call ${customer} ${customerMobilePhoneNumber}`,
            created_by_id: 1,
          },
        },
      },
    });

    const salesRepId = conferenceCustomerData?.client_call?.seller_id;

    const bdcId = conferenceCustomerData?.client_call?.bdc_id;

    await createNotification({
      message: `There is a missing call from ${customer} ${customerMobilePhoneNumber}`,
      notificationType: {
        warning: true,
      },
      assignedToId: salesRepId ? (bdcId ? [salesRepId, bdcId] : [salesRepId]) : null,
      notificationsForManagers: true,
    });

    io.emit('update_data', 'tasks');
  } catch (error) {
    console.log(error);
  }
}

const formatPhoneNumber = (value: string) => {
  if (!value) return '';

  const numericValue = value.replace(/\D/g, '').slice(0, 10);

  if (numericValue.length <= 3) {
    return `(${numericValue}`;
  }

  if (numericValue.length <= 6) {
    return `(${numericValue.slice(0, 3)}) ${numericValue.slice(3)}`;
  }

  return `(${numericValue.slice(0, 3)}) ${numericValue.slice(3, 6)}-${numericValue.slice(6)}`;
};
