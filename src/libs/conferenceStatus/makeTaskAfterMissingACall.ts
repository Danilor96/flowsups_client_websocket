import { createNotification } from '../notification/createNotification';
import { prisma } from '../prisma/prisma';
import { connectedUsers, io } from '../../websocketServer';
import { assignUserFromRoundRobin } from '../roundRobin/roundRobin';

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
        unknow_call_number: true,
      },
    });

    if (conferenceCustomerData && conferenceCustomerData.client_call?.mobile_phone) {
      const registeredCustomer = conferenceCustomerData.unknow_call_number ? false : true;

      const usersConnectedArray = Object.values(connectedUsers);

      const isConnected = (email: string) => {
        return usersConnectedArray.includes(email);
      };

      let newAssignedUser = await assignUserFromRoundRobin(
        conferenceCustomerData.client_call.mobile_phone,
        registeredCustomer,
      );

      let i = 0;

      while (i < usersConnectedArray.length) {
        if (newAssignedUser && isConnected(newAssignedUser)) break;

        newAssignedUser = await assignUserFromRoundRobin(
          conferenceCustomerData.client_call.mobile_phone,
          registeredCustomer,
        );

        i++;
      }

      const customer = `${conferenceCustomerData?.client_call?.first_name || ''} ${
        conferenceCustomerData?.client_call?.last_name || ''
      }`;

      const customerMobilePhoneNumber = conferenceCustomerData?.client_call?.mobile_phone
        ? formatPhoneNumber(conferenceCustomerData?.client_call?.mobile_phone)
        : '';

      if (newAssignedUser) {
        const assignedUser = await prisma.users.findUnique({
          where: {
            email: newAssignedUser,
          },
          select: {
            id: true,
          },
        });

        const task = await prisma.tasks.create({
          data: {
            description: `To call ${customer || 'Unregistered customer'} ${
              customerMobilePhoneNumber || conferenceCustomerData.unknow_call_number
            }`,
            title: 'Missing call',
            deadline: new Date(),
            status: 1,
            created_by: 1,
            assigned_to: assignedUser?.id,
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

        await createNotification({
          message: `There is a missing call from ${customer} ${customerMobilePhoneNumber}`,
          notificationType: {
            warning: true,
          },
          assignedToId: assignedUser?.id ? [assignedUser.id] : null,
          notificationsForManagers: true,
        });
      } else {
        await createNotification({
          message: `There is a missing call from ${customer} ${customerMobilePhoneNumber}`,
          notificationType: {
            warning: true,
          },
          exclusiveManagerNotification: true,
          notificationsForManagers: true,
        });
      }

      io.emit('update_data', 'tasks');
    }
  } catch (error) {
    console.log(error);
  }
}

export const formatPhoneNumber = (value: string) => {
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
