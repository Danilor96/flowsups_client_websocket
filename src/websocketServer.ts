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
import { handlingConferenceStatus } from './libs/conferenceStatus/conferenceStatus';
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

app.post('/getZapier', (req, res) => {
  console.log(req.body.adf.prospect.customer.contact.name[0]._);
  console.log(req.body.adf.prospect.customer.contact.name[1]._);
  console.log(req.body.adf.prospect.customer.contact.email);
  console.log(req.body.adf.prospect.customer.contact.phone);
  console.log(req.body.adf.prospect.customer.comments);
  console.log(req.body.adf.prospect.vehicle.$.interest);
  console.log(req.body.adf.prospect.vehicle.$.status);
  console.log(req.body.adf.prospect.vehicle.make);
  console.log(req.body.adf.prospect.vehicle.model);
  console.log(req.body.adf.prospect.vehicle.year);
  console.log(req.body.adf.prospect.vehicle.odometer._);
  console.log(req.body.adf.prospect.vehicle.odometer.$.units);
  console.log(req.body.adf.prospect.vehicle.trim);

  res.send('Llegó');
});

// object to save current flowsups connected users

export const connectedUsers: { [id: string]: string } = {};

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
    }
  }

  // checking all pending tasks, appointments and statuses

  cron.schedule('* * * * 1-6', async () => {
    await pendingTasks();

    await pendingRescheduleAppointments();

    await latesUsersTasks();

    await pendingDeliveries();

    await customerStatus();
  });

  // checking all customers last contacted day

  cron.schedule('0 0 * * 1-5', async () => {
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
      });
    } catch (error) {
      console.log(error);
    }

    res.status(204).send();
  });

  app.post('/getCurrentConferenceCallStatus/:conferenceName', async (req, res) => {
    const callStatus = req.body.CallStatus;
    const callSid = req.body.CallSid;
    const conferenceName = req.params.conferenceName;

    console.log(`Call: ${callSid}. Status: ${callStatus}`);

    if (callStatus == 'ringing') {
      io.emit('update_data', 'transferCompleted', { conferenceName });
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

    const message = req.body.Body;

    await handlingIncomingSms({ from, message });
  });

  // sent sms status

  app.post('/smsStatus', async (req, res) => {
    try {
      console.log('socket!');

      const to = req.body.To;
      const status = req.body.MessageStatus;
      const errorMessage = req.body.ErrorMessage;
      const errorCode = req.body.ErrorCode;
      const messageSid = req.body.MessageSid;

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

  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${connectedUsers[socket.id]}`);

    delete connectedUsers[socket.id];
  });
});

const port = env.WEBSOCKET_PORT;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
