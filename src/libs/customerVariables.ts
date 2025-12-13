const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const url = process.env.TWILIO_WEBSOCKET_URL;

import twilio from 'twilio';
import { TemplateVariablesValues } from './definitions';
import { prisma } from './prisma/prisma';
import { parseISO } from 'date-fns';
import { uploadImageForSms } from './uploadImage.services';

const client = twilio(accountSid, authToken);

export const replaceVariables = (sms: string, data: any) => {
  return sms.replace(/{(\w+\.\w+)}/g, (_, key) => {
    const keys = key.split('.');
    return keys.reduce((obj: any, k: any) => (obj ? obj[k] : ''), data);
  });
};

export async function getCustomerSmsTemplateVariablesValues(customerId: string) {
  const customerIdNumber = parseInt(customerId);

  try {
    const data = await prisma.clients.findUnique({
      where: {
        id: customerIdNumber,
      },
      select: {
        first_name: true,
        last_name: true,
        email: true,
        home_phone: true,
        middle_initials: true,
        mobile_phone: true,
        salutation: true,
        suffix: true,
        work_phone: true,
        client_address: {
          select: {
            city: true,
            state: {
              select: {
                state: true,
              },
            },
            street: true,
            zip: true,
          },
        },
        lead_source: {
          select: {
            source: true,
          },
        },
        seller: {
          select: {
            name: true,
            last_name: true,
            mobile_phone: true,
            email: true,
          },
        },
        bdc: {
          select: {
            id: true,
            name: true,
            last_name: true,
            mobile_phone: true,
            email: true,
          },
        },
        finance_manager: {
          select: {
            id: true,
            name: true,
            last_name: true,
            mobile_phone: true,
            email: true,
          },
        },
        interested_vehicle: {
          select: {
            vehicle_brands: {
              select: {
                brand: true,
              },
            },
            vehicle_models: {
              select: {
                model: true,
              },
            },
            title_license: {
              select: {
                asking_price: true,
                buy_now_price: true,
                floor_price: true,
                whole_price: true,
              },
            },
            exterior_vehicle_colors: {
              select: {
                color: true,
              },
            },
            vehicle_mileages: {
              select: {
                mileage: true,
              },
            },
            vehicle_trim: {
              select: {
                trim: true,
              },
            },
            vehicle_identification_numbers: {
              select: {
                vin: true,
              },
            },
            vehicle_manufacture_years: {
              select: {
                year: true,
              },
            },
          },
        },
      },
    });

    await prisma.$disconnect();

    return data;
  } catch (error) {
    console.log(error);

    await prisma.$disconnect();
  }
}

export const dataObject = (
  templateVariablesValues: TemplateVariablesValues,
  appointmentDateStart?: string,
  appointmentDateEnd?: string,
) => {
  return {
    customer: {
      first_name: templateVariablesValues?.first_name,
      last_name: templateVariablesValues?.last_name,
      email: templateVariablesValues?.email,
      city: templateVariablesValues?.client_address?.city,
      home_phone: templateVariablesValues?.home_phone,
      lead_source: templateVariablesValues?.lead_source?.source,
      middle_name: templateVariablesValues?.middle_initials,
      mobile: templateVariablesValues?.mobile_phone,
      salutation: templateVariablesValues?.salutation,
      state: templateVariablesValues?.client_address?.state.state,
      street: templateVariablesValues?.client_address?.street,
      suffix: templateVariablesValues?.suffix,
      work_phone: templateVariablesValues?.work_phone,
      zip: templateVariablesValues?.client_address?.zip,
      assigned_sales_rep: `${templateVariablesValues?.seller?.name || ''} ${
        templateVariablesValues?.seller?.last_name || ''
      }`,
      assigned_sales_rep_first_name: templateVariablesValues?.seller?.name || '',
      assigned_sales_rep_last_name: templateVariablesValues?.seller?.last_name || '',
      assigned_bdc_rep: `${templateVariablesValues?.bdc?.name || ''} ${
        templateVariablesValues?.bdc?.last_name || ''
      }`,
      assigned_bdc_rep_first_name: templateVariablesValues?.bdc?.name || '',
      assigned_bdc_rep_last_name: templateVariablesValues?.bdc?.last_name || '',
    },
    admin: {
      sales_rep_email: templateVariablesValues?.seller?.email || '',
      sales_rep_mobile: templateVariablesValues?.seller?.mobile_phone || '',
      [`today's_date`]: new Date().toISOString(),
    },
    inventory: {
      interested_vehicle: `${
        templateVariablesValues?.interested_vehicle?.vehicle_brands.brand || ''
      } ${templateVariablesValues?.interested_vehicle?.vehicle_models.model || ''}`,
      interested_vehicle_asking_price:
        templateVariablesValues?.interested_vehicle?.title_license?.asking_price || '',
      interested_vehicle_color:
        templateVariablesValues?.interested_vehicle?.exterior_vehicle_colors?.color || '',
      interested_vehicle_make:
        templateVariablesValues?.interested_vehicle?.vehicle_brands.brand || '',
      interested_vehicle_mileage:
        templateVariablesValues?.interested_vehicle?.vehicle_mileages?.mileage || '',
      interested_vehicle_model:
        templateVariablesValues?.interested_vehicle?.vehicle_models.model || '',
      interested_vehicle_new_price:
        templateVariablesValues?.interested_vehicle?.title_license?.buy_now_price || '',
      interested_vehicle_old_price:
        templateVariablesValues?.interested_vehicle?.title_license?.floor_price || '',
      interested_vehicle_price:
        templateVariablesValues?.interested_vehicle?.title_license?.whole_price || '',
      interested_vehicle_trim:
        templateVariablesValues?.interested_vehicle?.vehicle_trim?.trim || '',
      interested_vehicle_vin:
        templateVariablesValues?.interested_vehicle?.vehicle_identification_numbers.vin || '',
      interested_vehicle_year:
        templateVariablesValues?.interested_vehicle?.vehicle_manufacture_years?.year || '',
    },
    appointment: {
      appointment_date: `${dateFormat(5, appointmentDateStart)} - ${dateFormat(
        1,
        appointmentDateEnd,
      )}`,
    },
  };
};

const dateFormat = (format: number, date?: string) => {
  let newDateFormat = {};

  if (date) {
    switch (format) {
      case 1:
        newDateFormat = {
          hour: '2-digit',
          minute: '2-digit',
        };
        break;

      case 2:
        newDateFormat = {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        };
        break;

      case 3:
        newDateFormat = {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        };
        break;

      case 4:
        newDateFormat = {
          month: 'long',
        };
        break;

      case 5:
        newDateFormat = {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        };
        break;
    }

    const dateFormat = new Intl.DateTimeFormat('en-US', newDateFormat);

    return dateFormat.format(new Date(date));
  } else {
    return '';
  }
};

export const sendSms = async (sms: string, to: string, senderId: string, file?: File | null) => {
  try {
    const statusCallbacUrl = `${url}/smsStatus`;

    let smsMediaUrl: string | null = null;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();

      const imageBuffer = Buffer.from(arrayBuffer);

      smsMediaUrl = file ? await uploadImageForSms(senderId, imageBuffer, file.type) : null;
    }

    const res = await client.messages.create({
      body: sms,
      from: twilioPhoneNumber,
      to: `+1${to}`,
      mediaUrl: smsMediaUrl ? [smsMediaUrl] : undefined,
      statusCallback: statusCallbacUrl,
    });

    const sentSms = res.body;
    const createdAt = res.dateCreated;

    const data = await prisma?.client_sms.create({
      data: {
        message: sentSms,
        message_sid: res.sid,
        sent_by_user: true,
        fileAttachment: file ? { name: file.name, url: smsMediaUrl } : undefined,
        status: {
          connect: {
            id: 1,
          },
        },
        client_message: {
          connect: {
            mobile_phone: to,
          },
        },
        user: {
          connect: {
            id: parseInt(senderId),
          },
        },
        date_sent: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            last_name: true,
            id: true,
          },
        },
      },
    });

    const customerActivity = await prisma.clients.update({
      where: {
        mobile_phone: to,
      },
      data: {
        last_activity: parseISO(new Date().toISOString()),
      },
    });

    // check if sms configuration is setted to active lost customers after send them a message

    // get the customer status

    const customerStatus = await prisma.clients.findUnique({
      where: {
        mobile_phone: to,
      },
      include: {
        client_status: {
          select: {
            id: true,
          },
        },
      },
    });

    // get customer configuration

    const configSms = await prisma.customer_settings.findFirst();

    // check if the status of the customer is lost --> 12

    if (customerStatus?.client_status?.id === 12) {
      // check if the customer config is setted to active lost customers

      if (configSms?.active_lost_customer) {
        const activatingStatusStablished = configSms.set_active_lost_customer_status_to;

        await prisma.clients.update({
          where: {
            id: customerStatus.id,
          },
          data: {
            client_status_id: activatingStatusStablished ? activatingStatusStablished : 2,
          },
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};
