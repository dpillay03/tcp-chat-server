'use strict';

const net = require('net');
const EE = require('events');
const Client = require(`${__dirname}/lib/client.js`);
const PORT = process.env.PORT || 3000;
const server = net.createServer();
const ee = new EE();

const pool = [];

//Alerts user that they need to use @ symbol.
ee.on('default',(client) => {
    client.socket.write('not a command - use and @ symbol\n');
});

//Allows user to exit the chat.
ee.on('@quit', function(client){
    client.socket.end('Goodbeye');
    var index = pool.indexOf(client)
    if (index > -1) {
        pool.splice(index, 1);
    }
})

//Sends message to all the users.
ee.on('@all', function(client, string){
    pool.forEach(user => {
        if(user.nicname !== client.nickname){
            user.socket.write(`${client.nickname}, ${string}`)
        }
    });
});

//Allows user to create nickname
ee.on('@nickname', (client, string) => {
    let nickname = string.toString().split(' ').shift().trim();
    client.nickname = nickname;
    client.socket.write(`Your nickname is now: ${nickname}`);
});


//Allows user to send direct messages to other users.
ee.on('@dm', (client, string) => {
    var nickname = string.split(' ').shift().trim();
    var message = string.split(' ').splice(1).join(' ').trim();

    pool.forEach( c => {
        if(c.nickname === nickname){
            c.socket.write(`${client.nickname}: ${message}\n`);
        }
    });
});

//Shows all connected users.
ee.on('@list', (client, string) => {
    pool.forEach(users =>{
        users.socket.write(`User id: ${client.nickname}\n`);
    });
});

//Gives user a list of the commands.
ee.on('@help', (client) => {
   client.socket.write('How to use this chat:\n');
   client.socket.write('@help: list the commands\n');
   client.socket.write('@nickname: change your chat name\n');
   client.socket.write('@list: shows all users\n');
   client.socket.write('@all: message all users\n');
   client.socket.write('@dm: message specific users only\n');
   client.socket.write('@quit: exit the chatroom\n');
});

//Creates a user. Issues them an ID.
server.on('connection', (socket) => {
    let client = new Client(socket);
    pool.push(client);
    console.log(client.nickname);
    socket.write('Connected!\n')

    socket.on('data', (data) => {
        const command = data.toString().split().shift().trim();
        console.log('=>:', command);
        if(command.startsWith('@')) {
            ee.emit(command, client, data.toString().split().splice(1).join());
            return;
        }
        ee.emit('default', client);
    });
});

//Tells you which port you are on.
server.listen(PORT, () => {
    console.log(`listening on ${PORT}!`);
});