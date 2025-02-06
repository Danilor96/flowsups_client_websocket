import {} from 'date-fns';
import { prisma } from '../prisma/prisma';
import { daysSinceXDate } from './datesDifferences/daysSinceXDate';
import { io } from '../../websocketServer';

export async function customerStatus() {
  try {
    // get the customers settings

    const customerSettings = await prisma.customer_settings.findFirst();

    // get the customers with any status except "lost"

    const customers = await prisma.clients.findMany({
      where: {
        client_status_id: {
          not: 12,
        },
      },
    });

    let modifiedRows = 0;
    const modifiedCustomersId: number[] = [];

    // check if there are clients with any status except "lost" and if already exists a customers configuration

    if (customers && customers.length > 0 && customerSettings) {
      // get the days after a lead is going to be setted as "lost"
      const daysAfterSetLeadAsLost = customerSettings.lead_lost_after;

      for (const customer of customers) {
        if (customer.last_activity) {
          const lastActivityDate = new Date(customer.last_activity);

          const daysSinceLastActivity = daysSinceXDate(lastActivityDate);

          if (daysAfterSetLeadAsLost && daysSinceLastActivity > daysAfterSetLeadAsLost) {
            // if there is a customer with a "last activity day" that exceed the
            // "day after been considered lost", then changes the status to "lost"

            const data = await prisma.clients.update({
              where: {
                id: customer.id,
              },
              data: {
                client_status_id: 12,
              },
            });

            modifiedRows += 1;
            modifiedCustomersId.push(data.id);
          }
        }
      }
    }

    if (modifiedRows > 0) {
      io.emit('update_data', 'lostCustomers', {
        modifiedCustomersId,
      });
    }
  } catch (error) {
    console.log(error);
  }
}
