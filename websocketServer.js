import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { env } from 'process';
import bodyParser from 'body-parser';
import bodyParserXml from 'body-parser-xml';
import cors from 'cors';
import cron from 'node-cron';
import twilio from 'twilio';
import { subMinutes, addMinutes, endOfToday } from 'date-fns';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const websocketPublicUrl = process.env.TWILIO_WEBSOCKET_URL;
const nextPublicUrl = process.env.NEXT_API_URL;

const VoiceResponse = twilio.twiml.VoiceResponse;
const twiml = new VoiceResponse();
const dial = twiml.dial();
const client = twilio(accountSid, authToken);

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();
const io = new Server(server, {
  cors: {
    origin: [process.env.CORS_ORIGIN1, process.env.CORS_ORIGIN2],
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

const connectedUsers = {};

io.on('connection', (socket) => {
  //function for specify a user in the websocket with email
  const sendTo = (email) => {
    const userAsking = Object.keys(connectedUsers).find((id) => connectedUsers[id] == email);
    return userAsking;
  };

  //function to retrieve tasks of an user with their email
  const sendTasks = async (assignedUserEmail) => {
    const userTasks = await prisma.tasks.findMany({
      where: {
        assigned: {
          email: assignedUserEmail,
        },
        AND: {
          status: {
            not: 3,
          },
        },
      },
      select: {
        id: true,
        description: true,
        title: true,
        status: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    await prisma.$disconnect();

    if (sendTo(assignedUserEmail) && userTasks) {
      io.to(sendTo(assignedUserEmail)).emit('received_tasks', userTasks);
    }
  };

  //save logged users
  socket.on('login', (user) => {
    connectedUsers[socket.id] = user;

    //retrieve tasks to logged users
    socket.on('ask_for_tasks', async (askedUser) => {
      sendTasks(askedUser);
    });
  });

  // retrieve user notifications
  socket.on('ask_for_notifications', (user) => {
    io.to(sendTo(user)).emit('get_user_notifications', true);
  });

  //save new task and send task to assigned user
  socket.on('save_task', async (data) => {
    /* 1) */ const task = await prisma.tasks.create({
      data: {
        description: data.description,
        title: data.title,
        creator: {
          connect: {
            id: data.creator,
          },
        },
        assigned: {
          connect: {
            id: data.assigned,
          },
        },
        task_status: {
          connect: {
            id: data.task_status,
          },
        },
      },
    });
    await prisma.$disconnect();

    /* 2) */ sendTasks(data.assignedEmail);
  });

  //set a new task status, from the assigned user
  socket.on('set_task_status', async (data) => {
    const taskStatusId = parseInt(data.status);

    // "finished" task status
    if (taskStatusId === 3) {
      const taskStatusChanged = await prisma.tasks.update({
        where: {
          id: data.taskId,
        },
        data: {
          status: {
            set: taskStatusId,
          },
          finished_at: new Date(),
        },
      });

      await prisma.$disconnect();
    }

    //"in progress" or "to do" task status
    const taskStatusChanged = await prisma.tasks.update({
      where: {
        id: data.taskId,
      },
      data: {
        status: {
          set: taskStatusId,
        },
        updated_at: new Date(),
      },
    });

    const creatorEmail = await prisma.tasks.findUnique({
      where: {
        id: data.taskId,
      },
      select: {
        creator: {
          select: {
            email: true,
          },
        },
        assigned: {
          select: {
            email: true,
          },
        },
      },
    });

    await prisma.$disconnect();

    sendTasks(data.activeUser);
    io.emit('ask_for_all_tasks_of_an_user', {
      selectedUser: creatorEmail.assigned.email,
      activeUser: creatorEmail.creator.email,
    });
  });

  //get all tasks of a specific user
  socket.on('ask_for_all_tasks_of_an_user', async (data) => {
    const specificTasks = await prisma.tasks.findMany({
      where: {
        assigned: {
          email: data.selectedUser,
        },
        AND: {
          creator: {
            email: data.activeUser,
          },
        },
      },
      include: {
        task_status: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    await prisma.$disconnect();

    //retrieve all tasks of the specific user
    if (specificTasks && sendTo(data.activeUser)) {
      io.to(sendTo(data.activeUser)).emit('get_all_tasks_of_an_user', specificTasks);
    }
  });

  // checking all pending tasks, appointments and statuses
  cron.schedule('* * * * 1-6', async () => {
    const lateTasks = await prisma.tasks.findMany({
      where: {
        deadline: {
          lt: new Date(),
        },
        status: 1,
      },
    });

    if (lateTasks && lateTasks.length > 0) {
      lateTasks.forEach(async (task) => {
        const notificationTask = await prisma.notifications.create({
          data: {
            message: `Task '${task.description}' has expired`,
            created_at: new Date(),
            user_id: task.assigned_to,
            type_id: 1,
          },
        });
      });
    }

    const tasks = await prisma.tasks.updateMany({
      where: {
        deadline: {
          lt: new Date(),
        },
        status: 1,
      },
      data: {
        status: 4,
      },
    });

    const appt = await prisma.clients.updateMany({
      where: {
        appointment: {
          every: {
            end_date: {
              lt: todayDate,
            },
            AND: {
              status_id: 1,
            },
          },
        },
      },
      data: {
        client_status_id: 8,
      },
    });

    await prisma.$disconnect();

    io.emit('update_data', 'notifications');
  });

  // checking all customers last contacted day

  cron.schedule('0 0 * * 1-5', async () => {
    const todayDate = new Date();

    const customers = await prisma.clients.findMany();

    const customerSettings = await prisma.customer_settings.findFirst();

    const daysUntilLost = customerSettings.lead_lost_after;

    for (let i = 0; i < customers.length; i++) {
      const element = customers[i];

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

    let callStatusId, socketEmit, toClientAnswered;

    switch (callStatus) {
      case 'initiated':
        callStatusId = 1;
        break;

      case 'ringing':
        break;

      case 'in-progress':
        callStatusId = 6;
        socketEmit = 'callInProgress';
        break;

      case 'busy':
        callStatusId = 2;
        break;

      case 'failed':
        callStatusId = 4;
        break;

      case 'no-answer':
        callStatusId = 3;
        break;

      case 'completed':
        callStatusId = 1;
        break;
    }

    let callExists = null;

    callExists = await prisma.client_calls.findUnique({
      where: {
        call_sid: parentCallSid,
      },
      select: {
        id: true,
      },
    });

    if (!callExists) {
      callExists = await prisma.client_calls.findUnique({
        where: {
          call_sid: callSid,
        },
        select: {
          id: true,
        },
      });
    }

    if (callExists && callStatusId) {
      const callData = await prisma.client_calls.update({
        where: {
          id: callExists.id,
        },
        data: {
          call_status_id: callStatusId,
          call_duration: callDuration,
        },
      });
    }

    socketEmit &&
      io.emit('update_data', socketEmit, {
        callSid,
        parentCallSid,
        toClientAnswered,
      });

    res.status(204).send();
  });

  // get current conference status

  app.post('/getCurrentConferenceStatus/:conferenceName', async (req, res) => {
    try {
      const conferenceSid = req.body.ConferenceSid;
      const conferenceName = req.body.FriendlyName;
      const conferenceStatus = req.body.StatusCallbackEvent;
      const from = req.body.FriendlyName.split('_')[0];
      const sequence = req.body.SequenceNumber;
      const eventTimestamp = req.body.Timestamp;
      const callSid = req.body.CallSid;
      const conferenceParticipansList = await (await client.conferences(conferenceSid).fetch())
        .participants()
        .list();

      // first conference action sequence
      if (sequence === '1') {
        // save the conference attempt in the web data base
        const customerData = await prisma.clients.findUnique({
          where: {
            mobile_phone: from,
          },
          select: {
            id: true,
            seller: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        });

        createCallStatusInDatabase(customerData?.id, customerData?.seller?.id, from, conferenceSid);

        // advise the web users of the incoming call (conference)

        const usersConnectedArray = Object.values(connectedUsers);

        // function to check if the related web user is connected
        const isConnected = (email) => {
          usersConnectedArray.includes(email);
        };

        // check if the phone number of the incoming call is related to a registered customer

        if (
          customerData &&
          customerData.seller &&
          customerData.seller.email &&
          isConnected(customerData.seller.email)
        ) {
          io.to(sendTo(relateAssignedUserDevice.seller.email)).emit(
            'update_data',
            'joinConference',
            {
              conferenceName,
              conferenceSid,
            },
          );

          // if there is no relation with the caller or if the
          // related web user is no connected then transfer the call
          // to all connected users
        } else {
          io.emit('update_data', 'joinConference', {
            conferenceName,
            conferenceSid,
          });
        }
      }

      console.log(`Conference SID: ${conferenceSid}, Status: ${conferenceStatus}.`);

      switch (conferenceStatus) {
        case 'conference-end':
          // set the conference duration
          const startConfDate = await prisma.client_calls.findUnique({
            where: {
              call_sid: conferenceSid,
            },
            select: {
              call_date: true,
            },
          });

          const endConfTime = new Date(eventTimestamp).getTime();
          const startConfTime = new Date(startConfDate.call_date).getTime();

          const callDuration = (endConfTime - startConfTime) / 1000;

          await prisma.client_calls.update({
            where: {
              call_sid: conferenceSid,
            },
            data: {
              call_duration: callDuration.toString(),
              call_status_id: 1,
            },
          });

          io.emit('update_data', 'callDisconnect', {
            endedConferenceName: conferenceName,
          });
          break;

        case 'participant-join':
          // check if the first two participants are just the caller customer and
          // the first user that accept the call. Disconnect the rest of the web users from
          // this call

          const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (conferenceParticipansList.length > 1 && sequence >= 2 && sequence <= 3) {
            const firstUserEmail = (
              await client
                .calls(conferenceParticipansList[conferenceParticipansList.length - 2].callSid)
                .fetch()
            ).from.split(':')[1];

            const participantMobilePhone = (
              await client
                .calls(conferenceParticipansList[conferenceParticipansList.length - 2].callSid)
                .fetch()
            ).to;

            const noFirtsUsersCallSid = conferenceParticipansList.map((el) => el.callSid);

            if (firstUserEmail) {
              io.emit('update_data', 'lastParticipant', {
                userEmail: firstUserEmail,
                callSidArray: noFirtsUsersCallSid,
                inProgressConferenceName: conferenceName,
                conferenceSid: conferenceSid,
              });
            }

            if (participantMobilePhone && !regexCorreo.test(participantMobilePhone)) {
              io.emit('update_data', 'lastParticipant', {
                userEmail: '',
                callSidArray: noFirtsUsersCallSid,
                inProgressConferenceName: conferenceName,
                conferenceSid: conferenceSid,
                userMobilePhoneNumber: participantMobilePhone.slice(-10),
              });
            }
          }

          // check if there are a web user that accidentally has joined the conference and
          // then disconnect it/them

          if (conferenceParticipansList.length > 2 && sequence > 3) {
            const webParticipants = [];
            let firstParticipantEmail = '';

            conferenceParticipansList.forEach(async (participantInfo) => {
              if (
                conferenceParticipansList[conferenceParticipansList.length - 2].callSid !==
                participantInfo.callSid
              ) {
                const participantFetched = await client.calls(participantInfo.callSid).fetch();

                if (regexCorreo.test(participantFetched.from)) {
                  webParticipants.push(participantFetched.from);
                }
              } else {
                firstParticipantEmail = (await client.calls(participantInfo.callSid).fetch()).from;
              }
            });

            // if participants are from web disconnect them

            if (webParticipants.length > 0) {
              io.emit('update_data', 'lastParticipant', {
                userEmail: firstParticipantEmail,
                callSidArray: webParticipants,
                inProgressConferenceName: conferenceName,
              });
            }

            // if participants are from a mobile phone then disconnect the first joined web participant from current call
            // (that means that there is a transfer in progress)

            const thirdConferenceParticipant = await client
              .calls(conferenceParticipansList[conferenceParticipansList.length - 3].callSid)
              .fetch();

            if (thirdConferenceParticipant && thirdConferenceParticipant.to) {
              io.emit('update_data', 'lastParticipant', {
                userEmail: '',
                callSidArray: [
                  conferenceParticipansList[conferenceParticipansList.length - 2].callSid,
                ],
                inProgressConferenceName: conferenceName,
              });
            }
          }

          break;

        case 'participant-leave':
          if (conferenceParticipansList.length === 1) {
            const currentConference = client.conferences(conferenceSid);

            currentConference.update({ status: 'completed' });
          }
          break;

        case 'conference-start':
          break;
      }
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

  // create call status function

  const createCallStatusInDatabase = async (customerId, userId, phoneNumber, callSid) => {
    if (callSid) {
      await prisma.client_calls.create({
        data: {
          client_id: customerId ? customerId : null,
          seller_id: userId ? userId : null,
          phone_number: phoneNumber ? phoneNumber : null,
          call_sid: callSid,
          call_date: new Date(),
          call_duration: '0',
          call_status_id: 6,
          call_direction_id: 1,
        },
      });
    }
  };

  // check how many times a customer made a call

  const checkCustomerMadeCalls = async (phoneNumber) => {
    // check if the customer has an active suspension

    const activeSuspension = await prisma.suspension.findFirst({
      where: {
        mobile_phone: phoneNumber,
        end_suspension_dat: {
          gt: new Date(),
        },
      },
    });

    if (activeSuspension) {
      return false;
    }

    // Check if the customer has any calls in the last 10 minutes

    const tenMinutesAgo = subMinutes(new Date(), 10);

    const incomingCalls = await prisma.client_calls.count({
      where: {
        call_direction_id: 1,
        call_date: {
          gte: tenMinutesAgo,
        },
        phone_number: phoneNumber,
      },
    });

    if (incomingCalls >= 5) {
      await prisma.suspension.create({
        data: {
          mobile_phone: phoneNumber,
          start_suspension_date: new Date(),
          end_suspension_dat: addMinutes(new Date(), 10),
        },
      });

      return false;
    }

    return true;
  };

  // get incoming call from customers

  app.post('/incomingCall', async (req, res) => {
    try {
      const from = req.body.From;
      const to = req.body.To;
      const conferenceName = `${from.slice(-10)}_conference`;

      const callPermission = await checkCustomerMadeCalls(from.slice(-10));

      console.log(callPermission);

      if (callPermission) {
        if (from && to && typeof from === 'string' && typeof to === 'string') {
          // create conference room

          const conference = dial.conference(
            {
              startConferenceOnEnter: true,
              endConferenceOnExit: true,
              waitUrl: `${nextPublicUrl}/api/waitConferenceUrl/${conferenceName}`,
              waitMethod: 'POST',
              statusCallback: `${websocketPublicUrl}/getCurrentConferenceStatus/${conferenceName}`,
              statusCallbackEvent: ['start', 'announcement', 'end', 'leave', 'join'],
              statusCallbackMethod: 'POST',
            },
            conferenceName,
          );

          res.type('text/xml');
          res.send(twiml.toString());
        }
      } else if (
        !callPermission &&
        from &&
        to &&
        typeof from === 'string' &&
        typeof to === 'string'
      ) {
        twiml.say(
          'You have an active suspension due to several call attempts. Please wait ten minutes to try again',
        );

        twiml.hangup();

        res.type('text/xml');
        res.send(twiml.toString());
      }
    } catch (error) {
      console.log(error);

      twiml.say('Thanks for using Flowsups. Good Bye!');

      res.type('text/xml');
      res.send(twiml.toString());
    }
  });

  // get messages from customers

  app.post('/getMessage', async (req, res) => {
    // if the user has the status "new" then change it to "contacted"

    const from = req.body.From.replace(/\D/g, '');

    const fromFormatted = from.slice(1);

    const message = req.body.Body;

    try {
      const clientIdStatusAppointments = await prisma.clients.findFirst({
        where: {
          mobile_phone: fromFormatted,
        },
        select: {
          client_status_id: true,
          id: true,
          seller: {
            select: {
              id: true,
            },
          },
          appointment: {
            where: {
              status_id: 1,
              start_date: {
                gt: new Date(),
              },
            },
            select: {
              id: true,
              status_id: true,
              start_date: true,
            },
          },
        },
      });

      if (clientIdStatusAppointments && clientIdStatusAppointments.id) {
        const data = await prisma.client_sms.create({
          data: {
            message: message,
            date_sent: new Date(),
            sent_by_user: false,
            client_id: clientIdStatusAppointments.id,
            status_id: 2,
          },
        });
      }

      if (
        clientIdStatusAppointments &&
        clientIdStatusAppointments.client_status_id &&
        clientIdStatusAppointments.client_status_id === 1
      ) {
        const userStatus = await prisma.clients.update({
          where: {
            mobile_phone: fromFormatted,
          },
          data: {
            client_status_id: 2,
          },
        });
      }

      // create a new lead register

      const lead = await prisma.client_has_lead.create({
        data: {
          created_at: new Date(),
          assigned_to_id: clientIdStatusAppointments.seller.id || 1,
          client_id: clientIdStatusAppointments.id,
          status_id: 2,
          created_by_id: clientIdStatusAppointments.seller.id || 1,
          lead_id: 7,
        },
      });

      // check if the message contain 'Y' , 'N' or 'S'

      const specialCharactersToAccept = ['Y', 'S'];
      const specialCharactersToCancel = ['N'];

      const messageSplitted = message.split(' ');

      // accept appointment
      if (messageSplitted.every((word) => specialCharactersToAccept.includes(word))) {
        // check if the customer has a pending for confirmation appointment

        if (clientIdStatusAppointments.appointment) {
          clientIdStatusAppointments.appointment.forEach(async (el) => {
            if (el.status_id === 1 && new Date(el.start_date) > new Date()) {
              await prisma.appointments.update({
                where: {
                  id: el.id,
                },
                data: {
                  status_id: 6,
                  client_accept_appointment: true,
                },
              });
            }
          });

          await prisma.clients.update({
            where: {
              id: clientIdStatusAppointments.id,
            },
            data: {
              client_status_id: 6,
            },
          });
        }
      }

      // cancel appointment
      if (messageSplitted.every((word) => specialCharactersToCancel.includes(word))) {
        // check if the customer has a pending for confirmation appointment

        if (clientIdStatusAppointments.appointment) {
          clientIdStatusAppointments.appointment.forEach(async (el) => {
            if (el.status_id === 1 && new Date(el.start_date) > new Date()) {
              await prisma.appointments.update({
                where: {
                  id: el.id,
                },
                data: {
                  status_id: 3,
                  client_accept_appointment: true,
                },
              });
            }
          });
        }
      }

      await prisma.$disconnect();

      io.emit('update_data', 'customerMessage');
    } catch (error) {
      console.log(error);
    }
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
