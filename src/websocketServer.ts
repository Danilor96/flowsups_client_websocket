import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from 'process';
import bodyParser from 'body-parser';
import bodyParserXml from 'body-parser-xml';
import cors from 'cors';
import cron from 'node-cron';
import twilio from 'twilio';
import { prisma } from './libs/prisma/prisma';
import { handlingConferenceStatus, sendCallToWeb } from './libs/conferenceStatus/conferenceStatus';
import { handlingIncomingCall } from './libs/incomingCall/incomingCall';
import { handlingIncomingSms } from './libs/incomingSms/incomingSms';
import { handlingOutgoingCallStatus } from './libs/outgoingCallStatus/outgoinCallStatus';
import { pendingTasks } from './libs/minuteByMinuteCheck/pendingTasks';
import { pendingAppointments } from './libs/minuteByMinuteCheck/pendingAppointments';
import { pendingRescheduleAppointments } from './libs/minuteByMinuteCheck/pendingRescheduleAppointments';
import { latesUsersTasks } from './libs/minuteByMinuteCheck/lateUsersTasks';
import { pendingDeliveries } from './libs/minuteByMinuteCheck/pendingDeliveries';
import { customerStatus } from './libs/minuteByMinuteCheck/customerStatus';
import { parseISO } from 'date-fns';
import { smsStatus } from './libs/sentSmsStatus/sentSmsStatus';
import { checkSendingsSms } from './libs/checkSendingsSms/checkSendingsSms';
import { incomingFileSave } from './libs/mediaMessage.services';
import { setTheCallAsAnswered } from './libs/conferenceStatus/transferCall/checkIfTheCallWasAnswered';
import { entryHandler, exitHandler } from './libs/systemAccesses/systemAccessesHandler';
import { checkNotDispositionedLeads } from './libs/roundRobin/roundRobin';
import { salesPointsAssignService } from './libs/salesPointsServices/salesPointServices';
import {
  appoitmentReminderFromReminderTimeConfig,
  taskReminderFromReminderTimeConfig,
} from './libs/minuteByMinuteCheck/reminders/reminders';
import {
  callCreation,
  voiceSystemBackupNumber,
} from './libs/conferenceStatus/transferCall/transferCall';
import { decode } from 'html-entities';
import { Parser, processors } from 'xml2js';
import * as cheerio from 'cheerio';
import { incomingLeads } from './libs/incomingLeads/incomingLeads';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
export const client = twilio(accountSid, authToken);

const app = express();
const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: [process.env.CORS_ORIGIN1 || '', process.env.CORS_ORIGIN2 || ''],
    optionsSuccessStatus: 200,
  },
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN1,
    optionsSuccessStatus: 200,
  }),
);

bodyParserXml(bodyParser);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  bodyParser.xml({
    limit: '1MB',
    xmlParseOptions: {
      normalize: true,
      normalizeTags: true,
      explicitArray: false,
    },
  }),
);

async function processComplexHtmlBody(htmlBody: string): Promise<any | null> {
  try {
    // 1. Cargar el HTML completo en Cheerio
    const $ = cheerio.load(htmlBody);

    // 2. Extraer TODO el texto plano del documento. Cheerio se encarga de
    // juntar el texto de todos los <span> y descartar las etiquetas.
    const allText = $.text();

    // 3. ¡AHORA sí usamos una RegEx sobre el texto ya limpio!
    // La 's' al final es importante: permite que el '.' incluya saltos de línea.
    // Nota: Tu XML no tiene el prefijo "adf:", así que lo quité de la regex.
    const xmlRegex = /(<\?xml[\s\S]*?<\/adf>)/;
    const match = allText.match(xmlRegex);

    if (!match || !match[0]) {
      console.log('No se encontró el bloque XML en el texto extraído del HTML.');
      // Opcional: Imprime el texto extraído para depurar
      // console.log('Texto extraído:', allText);
      return null;
    }

    const xmlString = match[0];
    console.log('XML extraído del texto plano:', xmlString.substring(0, 90) + '...');

    // 4. Decodificar por si alguna entidad HTML persiste (buena práctica)
    const decodedXml = decode(xmlString);

    // 5. Convertir a JSON
    const parser = new Parser({
      explicitArray: false,
      trim: true,
      // No necesitamos procesador de prefijos si el XML no los tiene
    });
    const jsonObject = await parser.parseStringPromise(decodedXml);

    // Aquí puedes reincorporar tu función para aplanar el objeto si lo deseas
    return jsonObject;
  } catch (error) {
    console.error('Error durante el proceso:', error);
    return null;
  }
}

app.post('/getZapier', async (req, res) => {
  try {
    const rawHtml = req.body.html;

    const xmlProcessed = await processComplexHtmlBody(rawHtml);

    const { adf } = xmlProcessed;

    await incomingLeads(adf);
  } catch (error) {
    console.log(error);
  }

  res.send('Llegó');
});

// object to save current flowsups connected users

export const connectedUsers: { [id: string]: string } = {};

// function to check if the related web user is connected
export const isConnected = (email: string) => {
  const usersConnectedArray = Object.values(connectedUsers);

  return usersConnectedArray.includes(email);
};

//function for specify a user in the websocket with email

export const sendTo = (email: string, dataToUpdate: string, extraData?: any) => {
  io.to(email).emit('update_data', dataToUpdate, extraData);
};

io.on('connection', async (socket: Socket) => {
  //save logged active users

  const query = socket.handshake.query;
  const user = query?.userEmail;

  if (user) {
    console.log(`User connected: ${user}`);

    if (typeof user === 'string') {
      await socket.join(user);

      connectedUsers[socket.id] = user;

      await entryHandler(user);
    }
  }

  app.post('/getCurrentCallStatus', async (req, res) => {
    const callSid = req.body.CallSid;
    const parentCallSid = req.body.ParentCallSid;
    const callStatus = req.body.CallStatus;
    const callDuration = req.body.CallDuration ?? '0';

    console.log(`Call SID: ${callSid}, Status: ${callStatus}. Parent Call SID: ${parentCallSid}`);

    await handlingOutgoingCallStatus({
      callSid,
      parentCallSid,
      callStatus,
      callDuration,
    });

    res.status(204).send();
  });

  // get current conference status

  app.post('/getCurrentConferenceStatus/:conferenceName', async (req, res) => {
    try {
      const conferenceSid = req.body.ConferenceSid;
      const conferenceName = req.body.FriendlyName;
      const conferenceStatus = req.body.StatusCallbackEvent;
      const sequence = req.body.SequenceNumber;
      const eventTimestamp = req.body.Timestamp;
      const callSid = req.body.CallSid;
      const participantCallStatus = req.body.ParticipantCallStatus;
      const conferenceParticipansList = await (await client.conferences(conferenceSid).fetch())
        .participants()
        .list();

      // function that handle all active conference statuses

      await handlingConferenceStatus({
        callSid,
        conferenceName,
        conferenceParticipansList,
        conferenceSid,
        conferenceStatus,
        eventTimestamp,
        sequence,
        participantCallStatus,
      });
    } catch (error) {
      console.log(error);
    }

    res.status(204).send();
  });

  socket.on('cancelAutoTransfer', async (data) => {
    await setTheCallAsAnswered(data.conferenceName);
  });

  app.post('/getCurrentConferenceCallStatus/:conferenceName', async (req, res) => {
    try {
      const callStatus = req.body.CallStatus;
      const callSid = req.body.CallSid;
      const param = req.params.conferenceName;
      const conferenceName = param.split('.')[0];
      const conferenceSid = param.split('.')[1];
      const sequence = req.body.SequenceNumber;
      const customerPhone = req.query.customerPhone as string;
      let backupCalled = '';
      let callBackup = '';
      const conferenceParticipants = await client.conferences(conferenceSid).participants.list();

      if (req.query.backupCalled) backupCalled = req.query.backupCalled as string;
      if (req.query.callBackup) callBackup = req.query.callBackup as string;

      if (sequence === '0') {
        io.emit('update_data', 'transferCompleted', { conferenceName });
      }

      const hangUpConference = async () => {
        await client.conferences(conferenceSid).update({
          status: 'completed',
        });
      };

      if (conferenceSid) {
        const customerCall = conferenceParticipants.find((participant) => participant.hold);

        if (customerCall) {
          if (callStatus === 'in-progress') {
            const customerCall = conferenceParticipants.find((participant) => participant.hold);

            if (customerCall?.callSid) {
              await client.conferences(conferenceSid).participants(customerCall.callSid).update({
                hold: false,
                endConferenceOnExit: true,
              });
            }
          }

          if (callStatus === 'completed') {
            await hangUpConference();
          }
        }
      }

      if (callStatus === 'no-answer') {
        // call to backup number (web users didn't answer the call)

        if (callBackup) {
          await voiceSystemBackupNumber(
            conferenceSid,
            conferenceName,
            customerPhone,
            conferenceParticipants,
          );
        }

        // drop call if the backup number doesn't responds

        if (backupCalled) {
          hangUpConference();
        }

        // call to every user in the web (bdc and sales rep didn't answer the call)
        // if the web users doesn't responds in 12 seconds, then call to backup number

        if (!callBackup && !backupCalled) {
          await sendCallToWeb(conferenceName, conferenceSid, customerPhone);

          setTimeout(async () => {
            await voiceSystemBackupNumber(
              conferenceSid,
              conferenceName,
              customerPhone,
              conferenceParticipants,
            );
          }, 12000);
        }
      }

      console.log(`Call: ${callSid}. Status: ${callStatus}`);
    } catch (error) {
      console.log(error);
    }

    res.status(204).send();
  });

  // get incoming call from customers

  app.post('/incomingCall', async (req, res) => {
    const from = req.body.From;
    const to = req.body.To;

    await handlingIncomingCall({
      from,
      to,
      res,
    });
  });

  // get messages from customers

  app.post('/getMessage', async (req, res) => {
    // if the user has the status "new" then change it to "contacted"

    const from = req.body.From.replace(/\D/g, '');
    console.log('handlo]]ing incoming sms: ', from);

    const messageSid: string = req.body.MessageSid;
    const message = req.body.Body;
    const numMedia = parseInt(req.body.NumMedia);
    const media = req.body.MediaUrl0;
    const customerId = req.body.From;

    let files: { url?: string; name: string }[] | undefined = undefined;

    if (numMedia > 0) {
      const mediaPromises = Array.from({ length: numMedia }, (_, i) => {
        const mediaUrl = req.body[`MediaUrl${i}`];
        const mediaType = req.body[`MediaContentType${i}`];
        if (!mediaUrl || !mediaType) return Promise.resolve(null);

        return incomingFileSave(mediaUrl, mediaType, customerId)
          .then((fileUrl) => ({
            url: fileUrl,
            name: `${messageSid}_${i}.${mediaType}`,
          }))
          .catch((err) => {
            console.error(`Error saving media ${i}:`, err);
            return null;
          });
      });

      const results = await Promise.all(mediaPromises);
      files = results.filter((result) => result !== null);
    }

    await handlingIncomingSms({ from, message, file: files });
  });

  // sent sms status

  app.post('/smsStatus', async (req, res) => {
    try {
      const to = req.body.To;
      const status = req.body.MessageStatus;
      const errorMessage = req.body.ErrorMessage;
      const errorCode = req.body.ErrorCode;
      const messageSid = req.body.MessageSid;
      console.log(`Message: ${messageSid}. Status: ${status}`);
      await smsStatus(to, status, errorMessage, errorCode, messageSid);
    } catch (error) {
      console.log(error);
    }

    res.status(204).send();
  });

  socket.on(
    'ask_for_update_data',
    (dataToUpdate, specificUser = false, userEmail = null, extraData = null) => {
      if (specificUser && userEmail) {
        sendTo(userEmail, dataToUpdate, extraData);
      } else {
        io.emit('update_data', dataToUpdate, extraData);
      }
    },
  );

  socket.on('disconnect', async (reason) => {
    if (connectedUsers[socket.id]) await exitHandler(connectedUsers[socket.id]);

    console.log(`User disconnected: ${connectedUsers[socket.id]}`);

    delete connectedUsers[socket.id];
  });

  app.post('/events/seller-activity', async (req, res) => {
    try {
      const body = req.body;
      await salesPointsAssignService(body);
    } catch (error) {
      console.log(error);
    }
    res.status(204).send();
  });
});

// checking all pending tasks, appointments and statuses

cron.schedule('* * * * 1-6', async () => {
  console.log('Minute by minute functions');

  await pendingTasks();

  await pendingRescheduleAppointments();

  await latesUsersTasks();

  await pendingDeliveries();

  await customerStatus();

  await checkSendingsSms();

  await checkNotDispositionedLeads();

  await taskReminderFromReminderTimeConfig();
  await appoitmentReminderFromReminderTimeConfig();
});

// checking all customers last contacted day

cron.schedule('0 0 * * 1-6', async () => {
  const todayIsos = new Date().toISOString();

  const todayDate = parseISO(todayIsos);

  const customers = await prisma.clients.findMany();

  const customerSettings = await prisma.customer_settings.findFirst();

  const daysUntilLost = customerSettings?.lead_lost_after;

  for (let i = 0; i < customers.length; i++) {
    const element = customers[i];

    if (element.last_activity && daysUntilLost) {
      const timeSinceLastActivity = element.last_activity.getTime() - todayDate.getTime();

      const daysSinceLastActivity = Math.ceil(timeSinceLastActivity / (1000 * 3600 * 24));

      if (daysSinceLastActivity >= daysUntilLost) {
        await prisma.clients.update({
          where: {
            id: element.id,
          },
          data: {
            client_status_id: 12,
            lost_date: todayDate,
          },
        });
      }
    }
  }

  await prisma.$disconnect();

  await pendingAppointments();

  io.emit('update_data', 'dailyTotals');
});

const port = env.WEBSOCKET_PORT;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
