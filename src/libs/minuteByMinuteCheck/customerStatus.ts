import {} from 'date-fns';
import { prisma } from '../prisma/prisma';
import { CustomersStatuses, io } from '../../websocketServer';

export async function customerStatusLostChecking() {
  try {
    // get the customers settings

    const customerSettings = await prisma.customer_settings.findFirst();

    // check if there are clients with any status except "lost" and if already exists a customers configuration

    const lostCustomerChangeSetting = customerSettings && customerSettings.lead_lost_after > 0;

    if (lostCustomerChangeSetting) {
      const dateCutoff = new Date();
      dateCutoff.setDate(dateCutoff.getDate() - customerSettings.lead_lost_after);

      await prisma.leads.updateMany({
        where: {
          has_ended: false,
          Clients: {
            last_activity: {
              lte: dateCutoff,
            },
          },
        },
        data: {
          customer_status_id: CustomersStatuses.Lost,
        },
      });

      await prisma.clients.updateMany({
        where: {
          Leads: {
            some: {
              has_ended: false,
            },
          },
          last_activity: {
            lte: dateCutoff,
          },
        },
        data: {
          client_status_id: CustomersStatuses.Lost,
          lost_date: new Date().toISOString(),
        },
      });

      const description = 'Lead setted to lost from system automated settings';

      const clientsId = await prisma.clients.findMany({
        where: {
          Leads: {
            some: {
              has_ended: false,
            },
          },
          last_activity: {
            lte: dateCutoff,
          },
        },
        select: {
          id: true,
        },
      });

      const commonData = {
        description,
        updated_at: new Date().toISOString(),
        updated_by: 1,
      };

      const eventsToCreate = clientsId.map((customer) => ({
        ...commonData,
        client_id: customer.id,
      }));

      await prisma.events.createMany({
        data: eventsToCreate,
      });
    }

    // io.emit('update_data', 'lostCustomers', {
    //   modifiedCustomersId,
    // });
  } catch (error) {
    console.log(error);
  }
}
