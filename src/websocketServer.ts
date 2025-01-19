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

export const sendTo = (email: string) => {
  const userAsking = Object.keys(connectedUsers).find((id) => connectedUsers[id] === email);
  return userAsking ?? '';
};

io.on('connection', (socket: Socket) => {
  //save logged active users
  socket.on('login', (user: string) => {
    connectedUsers[socket.id] = user;
  });

  // checking all pending tasks, appointments and statuses
  cron.schedule('* * * * 1-6', async () => {
    // const todayDate = new Date();
    // const lateTasks = await prisma.tasks.findMany({
    //   where: {
    //     deadline: {
    //       lt: new Date(),
    //     },
    //     status: 1,
    //   },
    // });
    // if (lateTasks && lateTasks.length > 0) {
    //   lateTasks.forEach(async (task) => {
    //     const notificationTask = await prisma.notifications.create({
    //       data: {
    //         message: `Task '${task.description}' has expired`,
    //         created_at: new Date(),
    //         user_id: task.assigned_to,
    //         type_id: 1,
    //       },
    //     });
    //   });
    // }
    // const tasks = await prisma.tasks.updateMany({
    //   where: {
    //     deadline: {
    //       lt: new Date(),
    //     },
    //     status: 1,
    //   },
    //   data: {
    //     status: 4,
    //   },
    // });
    // const appt = await prisma.clients.updateMany({
    //   where: {
    //     appointment: {
    //       every: {
    //         end_date: {
    //           lt: todayDate,
    //         },
    //         AND: {
    //           status_id: 1,
    //         },
    //       },
    //     },
    //   },
    //   data: {
    //     client_status_id: 8,
    //   },
    // });
    // await prisma.$disconnect();
    // io.emit('update_data', 'notifications');
  });

  // checking all customers last contacted day

  cron.schedule('0 0 * * 1-5', async () => {
    const todayDate = new Date();

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
              lost_date: new Date(),
            },
          });
        }
      }
    }

    await prisma.$disconnect();
  });

  // create notifications messages

  cron.schedule('0 0 * * 1-5', async () => {
    const tasksData = await prisma.tasks.findMany({
      where: {
        status: 4,
      },
    });

    for (let i = 0; i < tasksData.length; i++) {
      const el = tasksData[i];

      if (el.assigned_to) {
        const notificationData = await prisma.notifications.create({
          data: {
            message: `Task ${el.title} has expired`,
            type_id: 5,
            customer_id: el.customer_id,
            user_id: el.assigned_to,
          },
        });
      }
    }

    await prisma.$disconnect();
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
        connectedUsers,
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

  socket.on(
    'ask_for_update_data',
    (dataToUpdate, specificUser = false, userEmail = null, extraData = null) => {
      if (specificUser && userEmail) {
        io.to(sendTo(userEmail)).emit('update_data', dataToUpdate, extraData);
      } else {
        io.emit('update_data', dataToUpdate, extraData);
      }
    },
  );

  socket.on('disconnect', () => {
    delete connectedUsers[socket.id];
    console.log('User disconnected');
  });
});

const port = env.WEBSOCKET_PORT;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
