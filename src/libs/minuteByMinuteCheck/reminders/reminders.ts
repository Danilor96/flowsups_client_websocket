import { prisma } from '../../prisma/prisma';
import { subDays, isWithinInterval, addMinutes } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
  getCustomerSmsTemplateVariablesValues,
  dataObject,
  sendSms,
  replaceVariables,
} from '../../customerVariables';
import { createNotification } from '../../notification/createNotification';
import { tr } from 'date-fns/locale';

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

export async function taskReminderFromReminderTimeConfig() {
  const reminderTimes = (await prisma.reminderTime.findMany())
    .map((reminderTime) => {
      return {
        id: reminderTime.id,
        time:
          reminderTime.time && reminderTime.time !== 'none'
            ? Number(reminderTime.time.split(' ')[0])
            : null,
      };
    })
    .filter((reminderTime) => reminderTime.time !== null);

  // TODO: luego obtener el business del user loggeado
  const business = await prisma.business.findFirst({ select: { task_reminder_time_id: true } });
  let defaultReminderTimeId = business?.task_reminder_time_id || null;

  // reminderTimeId = 1 -> none --> no reminder
  if (defaultReminderTimeId === 1 || !defaultReminderTimeId) {
    defaultReminderTimeId = null;
  }

  console.log('defaultReminderTimeId: ', defaultReminderTimeId);
  try {
    for (const currentReminderTime of reminderTimes) {
      const now = new Date();
      const windowStart = addMinutes(now, currentReminderTime.time || 0);
      const windowEnd = addMinutes(windowStart, 1);
      // if (currentReminderTime.id === 3) {
      //   console.log('windowStart: ', windowStart);
      //   console.log('windowEnd: ', windowEnd);
      //   console.log('currentReminderTime: ', currentReminderTime);
      //   console.log(
      //     'consulta: ',
      //     defaultReminderTimeId && currentReminderTime.id === defaultReminderTimeId
      //       ? {
      //           OR: [{ reminder_time_id: currentReminderTime.id }, { reminder_time_id: null }],
      //         }
      //       : // Si no es el intervalo por defecto, busca una coincidencia exacta.
      //         {
      //           reminder_time_id: currentReminderTime.id,
      //         },
      //   );
      // }

      // 2. CONSTRUCCIÓN DE LA CONSULTA DINÁMICA
      const tasksToNotify = await prisma.tasks.findMany({
        where: {
          reminder_sent: false,
          assigned_to: { not: null },
          deadline: {
            gte: windowStart,
            lt: windowEnd,
          },
          // Si el intervalo actual es el por defecto, busca las tareas que
          // tengan ese intervalo o que no tengan ninguno (null).
          ...(defaultReminderTimeId && currentReminderTime.id === defaultReminderTimeId
            ? {
                OR: [{ reminder_time_id: currentReminderTime.id }, { reminder_time_id: null }],
              }
            : // Si no es el intervalo por defecto, busca una coincidencia exacta.
              {
                reminder_time_id: currentReminderTime.id,
              }),
        },
        select: {
          id: true,
          title: true,
          assigned_to: true,
          description: true,
        },
      });

      if (tasksToNotify.length === 0) {
        console.log(
          `⏳ No se encontraron tareas para notificar en el intervalo de ${currentReminderTime.time} min.`,
        );
        // if (currentReminderTime.id === 3) {
        //   console.log(`⏳ No se encontraron tareas para notificar en el intervalo de ${currentReminderTime.time} min.`);
        // }
        continue;
      }

      console.log(
        `⏳ Encontradas ${tasksToNotify.length} tareas para notificar en el intervalo de ${currentReminderTime.time} min.`,
      );

      // const notificationsData = tasksToNotify.map(task => ({
      //   message: `Task "${task.title}" is due in ${currentReminderTime.time} minutes.`,
      //   assignedToId: task.assigned_to ? [task.assigned_to] : [],
      //   // taskId: task.id,
      //   notificationType: {
      //     general: true,
      //   },
      // }));

      const notificationsData = tasksToNotify.map((task) => ({
        message: `Task "${task.title}" is due in ${currentReminderTime.time} minutes.`,
        user_id: task.assigned_to,
        type_id: 1,
      }));

      // const creationResult = await Promise.all(notificationsData.map(notification => createNotification(notification)));
      const creationResult = await prisma.notifications.createMany({
        data: notificationsData,
      });

      // const creationResult = await prisma.notification.createMany({
      //   data: notificationsData,
      // });
      console.log(`🚀 Creadas ${creationResult.count} notificaciones.`);

      const taskIdsToUpdate = tasksToNotify.map((task) => task.id);
      await prisma.tasks.updateMany({
        where: { id: { in: taskIdsToUpdate } },
        data: { reminder_sent: true },
      });

      // console.log(`👍 Marcadas ${taskIdsToUpdate.length} tareas como enviadas.`);
    }
  } catch (error) {
    console.error('❌ Error durante el proceso de recordatorios de tareas:', error);
  }
}

export async function appoitmentReminderFromReminderTimeConfig() {
  console.log('taskReminderFromReminderTimeConfig');
  const reminderTimes = (await prisma.reminderTime.findMany())
    .map((reminderTime) => {
      return {
        id: reminderTime.id,
        time:
          reminderTime.time && reminderTime.time !== 'none'
            ? Number(reminderTime.time.split(' ')[0])
            : null,
      };
    })
    .filter((reminderTime) => reminderTime.time !== null);

  // TODO: luego obtener el business del user loggeado
  const business = await prisma.business.findFirst({ select: { task_reminder_time_id: true } });
  let defaultReminderTimeId = business?.task_reminder_time_id || null;

  // reminderTimeId = 1 -> none --> no reminder
  if (defaultReminderTimeId === 1 || !defaultReminderTimeId) {
    defaultReminderTimeId = null;
  }

  console.log('defaultReminderTimeId: ', defaultReminderTimeId);
  try {
    for (const currentReminderTime of reminderTimes) {
      const now = new Date();
      const windowStart = addMinutes(now, currentReminderTime.time || 0);
      const windowEnd = addMinutes(windowStart, 1);
      // if (currentReminderTime.id === 3) {
      //   console.log('windowStart: ', windowStart);
      //   console.log('windowEnd: ', windowEnd);
      //   console.log('currentReminderTime: ', currentReminderTime);
      //   console.log(
      //     'consulta: ',
      //     defaultReminderTimeId && currentReminderTime.id === defaultReminderTimeId
      //       ? {
      //           OR: [{ reminder_time_id: currentReminderTime.id }, { reminder_time_id: null }],
      //         }
      //       : // Si no es el intervalo por defecto, busca una coincidencia exacta.
      //         {
      //           reminder_time_id: currentReminderTime.id,
      //         },
      //   );
      // }

      // 2. CONSTRUCCIÓN DE LA CONSULTA DINÁMICA
      const appoimentToNotify = await prisma.appointments.findMany({
        where: {
          reminder_sent: false,
          start_date: {
            gte: windowStart,
            lt: windowEnd,
          },
          // Si el intervalo actual es el por defecto, busca las tareas que
          // tengan ese intervalo o que no tengan ninguno (null).
          ...(defaultReminderTimeId && currentReminderTime.id === defaultReminderTimeId
            ? {
                OR: [{ reminder_time_id: currentReminderTime.id }, { reminder_time_id: null }],
              }
            : // Si no es el intervalo por defecto, busca una coincidencia exacta.
              {
                reminder_time_id: currentReminderTime.id,
              }),
        },
        select: {
          id: true,
          user_id: true,
          users: true,
          start_date: true,
          end_date: true,
          customers: true,
        },
      });

      if (appoimentToNotify.length === 0) {
        console.log(
          `⏳ No se encontraron appoitments para notificar en el intervalo de ${currentReminderTime.time} min.`,
        );
        // if (currentReminderTime.id === 3) {
        //   console.log(`⏳ No se encontraron tareas para notificar en el intervalo de ${currentReminderTime.time} min.`);
        // }
        continue;
      }

      console.log(
        `⏳ Encontradas ${appoimentToNotify.length} appoitments para notificar en el intervalo de ${currentReminderTime.time} min.`,
      );

      const notificationsData = appoimentToNotify.map((appoiment) => ({
        message: `Appoitment with customer ${
          appoiment.customers.name_lastname || appoiment.customers.first_name
        } in ${currentReminderTime.time} minutes.`,
        assignedToId: appoiment.user_id ? [appoiment.user_id] : [],
        // taskId: task.id,
        notificationType: {
          appointment: true,
        },
        appoimentId: appoiment.id,
      }));

      const creationResult = await Promise.all(
        notificationsData.map((notification) => createNotification(notification)),
      );

      // const creationResult = await prisma.notification.createMany({
      //   data: notificationsData,
      // });
      console.log(`🚀 Creadas ${creationResult.length} notificaciones.`);

      const appoimentIdsToUpdate = appoimentToNotify.map((task) => task.id);
      await prisma.appointments.updateMany({
        where: { id: { in: appoimentIdsToUpdate } },
        data: { reminder_sent: true },
      });

      // console.log(`👍 Marcadas ${taskIdsToUpdate.length} tareas como enviadas.`);
    }
  } catch (error) {
    console.error('❌ Error durante el proceso de recordatorios de appoitments:', error);
  }
}
