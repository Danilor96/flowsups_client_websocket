import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from  '@prisma/client'
import { z } from 'zod'
import { env } from 'process';
import twilio from 'twilio';
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const app = express()
const server = createServer(app);
const client = twilio(accountSid, authToken);
const prisma = new PrismaClient();
const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
  },
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

  // create a new client block

  socket.on('pass_new_client_data', async (data) => {
    if (data) {
      const clientSchema = z.object({
        first_name: z
        .string({invalid_type_error: 'Please, enter a valid value'})
        .min(1, 'Please, enter a name'),
        last_name: z
        .string({invalid_type_error: 'Please, enter a valid value'})
        .min(1, 'Please, enter a last name'),
        name_lastname: z
          .string({ invalid_type_error: 'Please, enter a valid value' })
          .min(1, 'Please, enter a name and lastname'),
        born_date: z
          .string({ invalid_type_error: 'Please, enter a valid value' })
          .min(1, 'Please, enter a date'),
        mobile_phone: z
          .string({ invalid_type_error: 'Please, enter a valid value' })
          .min(1, 'Please, enter a mobile phone'),
        home_phone: z
          .string({ invalid_type_error: 'Please, enter a valid value' })
          .min(1, 'Please, enter a home phone'),
        work_phone: z
          .string({ invalid_type_error: 'Please, enter a valid value' })
          .min(1, 'Please, enter a work phone'),
        email: z
          .string({ invalid_type_error: 'Please, enter a valid value' })
          .min(1, 'Please, enter a email'),
        current_address: z
          .string({ invalid_type_error: 'Please, enter a valid value' })
          .min(11, 'Please, enter a current address'),
        social_security: z
          .string({ invalid_type_error: 'Please, enter a valid value' })
          .min(1, 'Please, enter a social security'),
        lead_type: z
          .string({ invalid_type_error: 'Please, enter a valid value' })
          .min(1, 'Please, select a lead type'),
        lead_source: z
          .string({ invalid_type_error: 'Please, enter a valid value' })
          .min(1, 'Please, select a lead source'),
        type_of_client: z
          .string({ invalid_type_error: 'Please, enter a valid value' })
          .min(1, 'Please, select a client type'),
      });

      const responseTo = await data.created_by

      const validatedData = clientSchema.safeParse({
        name_lastname: data.name_lastname,
        born_date: data.born_date,
        mobile_phone: data.phone_number,
        home_phone: data.home_phone_number,
        work_phone: data.work_phone_number,
        email: data.email,
        current_address: data.current_address,
        social_security: data.social_security,
        lead_type: data.lead_type,
        lead_source: data.lead_source,
        type_of_client: data.type_of_client,
        first_name: data.first_name,
        last_name: data.last_name
      });      

      if (!validatedData.success) {
        io.to(sendTo(responseTo)).emit(
          'server_errors_response_to_client',
          validatedData.error.flatten().fieldErrors,
        );
        return;
      }

      const {
        born_date,
        current_address,
        email,
        home_phone,
        lead_source,
        lead_type,
        mobile_phone,
        name_lastname,
        social_security,
        type_of_client,
        work_phone,
        first_name,
        last_name
      } = validatedData.data;

      const duplicateEmail = await prisma.clients.findUnique({
        where:{
          email: email
        }
      })

      prisma.$disconnect()      

      let mssgE, mssgA

      const splitAddress = current_address.split(',')      

      if (duplicateEmail || splitAddress.length < 3) {
        
        if (duplicateEmail) {
                  
          mssgE = 'email already registered'
        }

        if (splitAddress.length < 3) {
          mssgA = 'Please, enter at least a Street name, a City name and a State separated by comma.'
        }

        io.to(sendTo(responseTo)).emit(
          'server_errors_response_to_client',
          {
            email:[mssgE],
            current_address:[mssgA],            
          },
        );

        return
      }            

      if (splitAddress[splitAddress.length-1] == 'undefined') {
        io.to(sendTo(responseTo)).emit(
          'server_errors_response_to_client',
          {            
            current_address:['Please, enter a valid current State. You can use (...) button to open for help'],            
          },
        );
        return
      }      

      try {        

        const address = await prisma.client_address.create({
          data:{
            city:splitAddress[1],
            street:splitAddress[0],
            States:{
              connect:{
                id: parseInt(splitAddress[splitAddress.length-1])         
              }
            }
          }
        })

        prisma.$disconnect()

        const data = await prisma.clients.create({
          data: {
            name_lastname,
            born_date:new Date(born_date),
            mobile_phone,
            home_phone,
            work_phone,
            email,
            current_address,
            social_security,
            lead_type_id: parseInt(lead_type),
            lead_source_id:parseInt(lead_source),
            client_type_id: parseInt(type_of_client),
            client_status_id:1,
            first_name,
            last_name,
            client_address_id:address.id
          },
        });

        prisma.$disconnect()

        io.to(sendTo(responseTo)).emit('server_message_response_to_client', {
          message: 'Data processed!',
          status: 200,
        });
      } catch (error) {
        console.log(error);
        io.to(sendTo(responseTo)).emit(
          'server_errors_response_to_client',
          error
        );        
      }      
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

    const twiml = new VoiceResponse();
    const phoneNumber = req.body.phoneNumber;

    const dial = twiml.dial();
    dial.conference({startConferenceOnEnter:true}, 'MyConference');

    res.type('text/xml')
    res.send(twiml.toString())

  })  

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
