import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from  '@prisma/client'
import { z } from 'zod'
import { env } from 'process';
import bodyParser from 'body-parser'
import cors from 'cors'
import twilio from 'twilio';
import MessagingResponse from 'twilio/lib/twiml/MessagingResponse.js';
import pkgd from 'twilio/lib/twiml/VoiceResponse.js'
import pkg from 'twilio/lib/base/BaseTwilio.js'
import { tokenGenerator, voiceResponse } from './handle.js'

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const app = express()
const server = createServer(app);
const client = twilio(accountSid, authToken);
const prisma = new PrismaClient();
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
  },
});

app.use(cors({
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
}))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

  // call streaming

  socket.on('call',(phoneNumber) => {    

    client.calls.create({      
      to: phoneNumber,
      from:twilioPhoneNumber,
      url:'https://m17qvw3s-3001.use2.devtunnels.ms/getCalls'
    }).then(call => {
      console.log(call);
    }).catch(error => {
      console.log(error);
    })

  })

  app.post('/getCalls', (req,res) =>{    
    
    console.log('pasé por aquí');

    res.contentType('xml');
    res.send(
      `<Response>
        <Dial>
          <Client>
            FlowsupsClientDetail
          </Client>
        </Dial>
      </Response>`
    )
    
    // <Stream url="wss://m17qvw3s-3001.use2.devtunnels.ms/getCalls"></Stream>
  })

  socket.on('callMessage',(callMessage)=>{

    io.emit('callMessage', callMessage)

  })

  app.post('/getMessage', (req,res) =>{

    console.log(req.body)

    const twiml = new MessagingResponse();
    
    twiml.message('Message received.')

    res.send(twiml.toString())

  })

  app.get('/token', (req,res)=>{
    
    res.send(tokenGenerator())

  })

  app.post('/voice', (req, res)=>{

    res.contentType('xml');
    res.send(
      `<Response>
        <Dial callerId="+12243134447">        
          <Client>
            FlowsupsClientDetail
          </Client>
        </Dial>
      </Response>`
    )
    
  })
  
  // res.set("Content-Type", "text/xml");
  // res.send(voiceResponse(req.body));
  
  // emit message to update client list  

  socket.on('updateClientsList',(data)=>{        

    io.emit('doUpdateClientsListInCostumerList', data)

  })

  socket.on('disconnect', () => {
    delete connectedUsers[socket.id];
    console.log('User disconnected');    

  });
});

const port = env.WEBSOCKET_PORT

server.listen(port, () => {  
  console.log(`Server running on port ${port}`);
});