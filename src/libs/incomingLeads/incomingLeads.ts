import { io } from '../../websocketServer';
import { prisma } from '../prisma/prisma';
import { ADFData } from './types';

export async function incomingLeads(adfData: ADFData) {
  try {
    const { customer, provider, requestdate, vehicle, vendor } = adfData.prospect;

    const { email, name, phone } = customer.contact;

    const [first, last] = name;

    const address = await prisma.client_address.create({
      data: {
        city: '',
        street: '',
        state_id: 1,
      },
    });

    const providerName = provider?.name;
    let existsLeadSource;
    if(providerName && providerName.length > 0) {
      existsLeadSource = await prisma.lead_sources.findFirst({
        where: {
          source: providerName.trim(),
        },
      });

      if (!existsLeadSource) {
        existsLeadSource = await prisma.lead_sources.create({
          data: {
            source: providerName.trim(),
          },
        });
      }
    }

    const newUser = await prisma.clients.create({
      data: {
        current_address: '',
        email: email || null,
        mobile_phone: phone?.replaceAll(' ', '') || null,
        first_name: first._ || '',
        last_name: last._ || '',
        name_lastname: `${first._ || ''} ${last._ || ''}`,
        social_security: '',
        lead_type_id: 1,
        client_address_id: address.id,
        lead_source_id: existsLeadSource?.id || 7,
        client_status_id: 1,
      },
    });

    const lead = await prisma.leads.create({
      data: {
        customer_id: newUser.id,
        customer_status_id: 1,
      },
    });

    const event = await prisma?.events.create({
      data: {
        description: `Customer created from email`,
        updated_at: new Date(),
        client_id: newUser.id,
      },
    });

    await prisma?.notifications.create({
      data: {
        message: `New customer created: ${newUser.first_name ?? ''} ${newUser.last_name ?? ''}`,
        type_id: 1,
        customer_id: newUser.id,
        notification_for_managers: true,
      },
    });

    io.emit('update_data', 'notifications');

    console.log('Guardado');
  } catch (error) {
    console.log(error);
  }
}

export const filterNumber = (value: string) => {
  let valueFiltered = value?.replace(/[^-\d.]/g, '');

  return valueFiltered;
};

// {
//   adf: {
//     prospect: {
//       requestdate: '[]',
//       provider: { name: 'Facebook K Bots', service: '[]', url: '' },
//       vendor: { vendorname: 'Zapier' },
//       customer: {
//         contact: {
//           name: [
//             { _: 'Pablo', '$': { part: 'first' } },
//             { _: 'Perez', '$': { part: 'last' } }
//           ],
//           email: 'mail@example.com',
//           phone: '444444444'
//         },
//         comments: 'Esta persona dejo su numero en Facebook, llamar {{178175579__user__custom_fields__Hour_tocall}}.'
//       },
//       vehicle: {
//         '$': { interest: 'buy', status: 'used' },
//         make: '[Make]',
//         model: '[Model]',
//         year: '[Year]',
//         odometer: { _: '[Odometer Reading]', '$': { units: 'mi' } },
//         trim: '[Trim level]'
//       }
//     }
//   }
// }
