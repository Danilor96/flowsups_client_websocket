import { prisma } from '../../prisma/prisma';
import { subDays, isWithinInterval } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
  getCustomerSmsTemplateVariablesValues,
  dataObject,
  sendSms,
  replaceVariables,
} from '../../customerVariables';

const timeZone = 'America/New_York';

export async function appointmentReminder() {
  try {
    const automaticSms = await prisma.automatic_sms.findFirst({
      include: {
        Sms_template_Automatic_sms_appointment_reminder_template_idToSms_template: true,
      },
    });

    if (automaticSms) {
      if (automaticSms.appointment_reminder && automaticSms.appointment_reminder_template_id) {
        const appointments = await prisma.appointments.findMany();

        const reminderBeforeDay = parseInt(automaticSms.appointment_reminder_timing);

        for (let i = 0; i < appointments.length; i++) {
          const appointment = appointments[i];

          const startDate = formatInTimeZone(
            appointment.start_date,
            timeZone,
            'yyyy-MM-dd HH:mm:ssXXX',
          );
          const now = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd HH:mm:ssXXX');

          const executionDateTime = subDays(startDate, reminderBeforeDay);

          if (isWithinInterval(now, { start: executionDateTime, end: startDate })) {
            if (!appointment.reminder_sent) {
              const customer = await prisma.clients.findUnique({
                where: {
                  id: appointment.customer_id,
                },
              });

              if (customer?.consent_approved) {
                const reminderMessage =
                  automaticSms
                    .Sms_template_Automatic_sms_appointment_reminder_template_idToSms_template
                    ?.template;

                if (reminderMessage) {
                  const customerVariablesValues = await getCustomerSmsTemplateVariablesValues(
                    customer.id.toString(),
                  );

                  const dataObj = dataObject(
                    customerVariablesValues,
                    appointment.start_date.toISOString(),
                    appointment.end_date.toString(),
                  );

                  const sms = replaceVariables(reminderMessage || '', dataObj);

                  await sendSms(sms, customer.mobile_phone, appointment.user_id.toString()).then(
                    async () => {
                      await prisma.appointments.update({
                        where: {
                          id: appointment.id,
                        },
                        data: {
                          reminder_sent: true,
                        },
                      });
                    },
                  );
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}
