var client_id = 0;
var clients = 0;
var client_sockets = [];
var PORT = 8080
const path = require('path');
var express = require('express');

const router = express.Router();
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);

router.get('/', function (req, res) {
  res.set("Connection", "keep-alive");
  res.sendFile(path.join(__dirname+'/view/index.html'));
});

router.get('/view/changelog.html', function (req, res) {
  res.set("Connection", "keep-alive");
  res.sendFile(path.join(__dirname+'/view/changelog.html'));
});

router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/paintcan.png'));
});

router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/trashcan.jpg'));
});

router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/brush.png'));
});

router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/favicon.ico'));
});

app.use(express.static(__dirname+'/Script'));
app.use(express.static(__dirname+'/images'));

app.use('/', router);

io.on('connection', function(socket) {
  console.log("a user connected: [" + socket.id + "]")
  socket.on('server msg', function(msg) {
    //console.log("recieved message: '" + msg + "'")
    var decoded = msg.split(':', 1);
    var rest = msg.substring(decoded[0].length + 1);
    //console.log("server msg type: " + decoded[0]);
    if (decoded[0] == "conn")
      connect_client(io, socket, rest);
    else if (decoded[0] == "dconn")
      disconnect_client(rest, io, socket);
    else if (decoded[0] == "imgData")
    {
      broadcast_image(rest);
    }
    else if (decoded[0] == "clr_cvs")
      send_clear();
    else if (decoded[0] == 'chat')
    {
      var msg_usr = rest.split('\0');
      broadcast_chat(msg_usr[0], msg_usr[1], msg_usr[2]);
    }
  });

});

http.listen(PORT, function() {
  console.log('listening on 73.98.154.126:8080');
});

function connect_client(io, socket, name)
{
  clients++;
  socket.nickname = name;
  client_sockets[client_id] = socket.id;
  io.emit('broadcast', { type: "CS", description: clients + ' client(s) connected!'});
  broadcast_chat('', name, 'connect');
  console.log("userID, name: [" + client_id + ", " + name + "] connected!");
  client_id++;
}

function disconnect_client(client_id, io, socket)
{
  
  client_sockets[client_id] = null;
  io.emit('broadcast', { type: "CS", description: clients + ' client(s) connected!'});
  broadcast_chat('', socket.nickname, 'disconnect');
  clients--;
  console.log(client_id + " disconnected!");
}

function broadcast_image(imgData)
{
  io.emit('broadcast', { type: "imgData", data: imgData});
}

function send_clear()
{
  io.emit('broadcast', {type: 'clr_cvs'});
}

function broadcast_chat(mesg, user, property)
{
  io.emit('broadcast', {type: 'chat', msg: mesg, usr: user, property: property});
}