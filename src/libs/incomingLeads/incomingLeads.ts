import { Prisma } from '@prisma/client';
import { io } from '../../websocketServer';
import { prisma } from '../prisma/prisma';
import { ADFData } from './types';

export async function incomingLeads(adfData: ADFData) {
  let countryCodeId: number | null = null;
  let phoneNumber = '';
  let customerEmail = '';
  let providerName = '';

  try {
    const { customer, provider, requestdate, vehicle, vendor } = adfData.prospect;

    const { email, name, phone } = customer.contact;

    customerEmail = email;

    const [first, last] = name;

    const address = await prisma.client_address.create({
      data: {
        city: '',
        street: '',
        state_id: 1,
      },
    });

    providerName = provider?.name;
    let existsLeadSource;
    if (providerName && providerName.length > 0) {
      existsLeadSource = await prisma.lead_sources.findFirst({
        where: {
          source: {
            equals: providerName.trim(),
            mode: 'insensitive',
          },
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
    console.log({
      provider,
      existsLeadSource,
      providerName,
    });

    const onlyNumbersCharacters = phone?.replace(/\D/g, '');
    phoneNumber = onlyNumbersCharacters.slice(-10);
    const areaCode = onlyNumbersCharacters.slice(0, -10);

    if (areaCode) {
      const countryPhoneCode = await prisma.country_phone_code.upsert({
        where: {
          code: `+${areaCode}`,
        },
        update: {},
        create: {
          code: `+${areaCode}`,
        },
      });

      countryCodeId = countryPhoneCode.id;
    }

    const newUser = await prisma.clients.create({
      data: {
        current_address: '',
        email: email || null,
        mobile_phone: phoneNumber || null,
        country_phone_code_id: countryCodeId,
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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        if (countryCodeId) {
          await prisma.clients.update({
            where: {
              mobile_phone: phoneNumber,
            },
            data: {
              country_phone_code_id: countryCodeId,
            },
          });
        }

        const mssg = `The system detected the customer as a duplicate due to repeat entry today${providerName ? ` from ${providerName}.` : '.'}`;

        const note = await prisma.notes.create({
          data: {
            note: mssg,
            created_at: new Date(),
            client_note: {
              connect: {
                mobile_phone: phoneNumber,
              },
            },
          },
          select: {
            id: true,
            client_id: true,
            client_note: {
              select: {
                seller_id: true,
                bdc_id: true,
              },
            },
          },
        });

        await prisma.client_has_lead.create({
          data: {
            created_at: new Date(),
            status_id: 2,
            client_id: note.client_id,
            note_id: note.id,
            lead_id: 1,
          },
        });

        await prisma.notifications.create({
          data: {
            message: mssg,
            type_id: 4,
            user_id: note.client_note.seller_id,
            notification_for_managers: true,
            customer_id: note.client_id,
          },
        });
      }
    }
  }
}

// const adfTest: ADFData = {
//   prospect: {
//     provider: { name: 'Indie', service: '[]', url: '' },
//     requestdate: '2025-09-24T17:57:00',
//     vehicle: {
//       year: '2022',
//       make: 'Toyota',
//       model: 'Corolla',
//       odometer: {
//         $: {
//           units: '1',
//         },
//         _: '',
//       },
//       $: {
//         interest: '',
//         status: '',
//       },
//       trim: '',
//     },
//     customer: {
//       comments: '',
//       contact: {
//         name: [
//           {
//             _: 'Dan',
//             $: {
//               part: 'first',
//             },
//           },
//           {
//             _: 'France',
//             $: {
//               part: 'last',
//             },
//           },
//         ],
//         email: '',
//         phone: '+1 (321) 123-4567',
//       },
//     },
//     vendor: {
//       vendorname: 'FlowsUps Motors',
//     },
//   },
// };

// incomingLeads(adfTest);

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
