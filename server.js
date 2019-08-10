var client_id = 0;
var clients = 0;
var drawer = 0;
var client_sockets = [];
var PORT = 8080
const path = require('path');
var express = require('express');
const fs = require('fs');
const router = express.Router();
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);
var current_word = "_0_0_0_0_0_";
var current_blanks_disp = "";
var gamestate = "offline";
var canvas_history = [];
var words;


fs.readFile('word_list.txt', 'utf-8', (err, data) => {
  if (err) throw err;

  words = data.split('\n');
})

router.get('/', function (req, res) {
  res.set("Connection", "keep-alive");
  res.sendFile(path.join(__dirname + '/view/index.html'));
});

router.get('/view/changelog.html', function (req, res) {
  res.set("Connection", "keep-alive");
  res.sendFile(path.join(__dirname + '/view/changelog.html'));
});

router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/paintcan.png'));
});

router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/trashcan.jpg'));
});

router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/brush.png'));
});

router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/favicon.ico'));
});

app.use(express.static(__dirname + '/Script'));
app.use(express.static(__dirname + '/images'));

app.use('/', router);

io.on('connection', function (socket) {
  console.log("a user connected: [" + socket.id + "]")
  socket.on('server msg', function (msg) {
    var decoded = msg.split(':', 1);
    var rest = msg.substring(decoded[0].length + 1);
    //console.log("server msg type: " + decoded[0]);
    if (decoded[0] == "conn")
      connect_client(io, socket, rest);
    else if (decoded[0] == "dconn")
      disconnect_client(rest, io, socket);
    else if (decoded[0] == "imgData") {
      broadcast_image(rest);
    }
    else if (decoded[0] == "clr_cvs")
      send_clear();
    else if (decoded[0] == 'chat') {
      var msg_usr = rest.split('\0');
      broadcast_chat(msg_usr[0], msg_usr[1], msg_usr[2]);
    }
    else if (decoded[0] == 'word_sel')
    {
      var blanks_word = rest.split('\0');
      current_blanks_disp = blanks_word[0];
      broadcast_display_blanks(current_blanks_disp);
      current_word = blanks_word[1];
      console.log("cw:" + current_word);
    }
  });

});

http.listen(PORT, function () {
  console.log('listening on 73.98.154.126:8080');
});

function connect_client(io, socket, name) {
  clients++;
  socket.nickname = name;
  client_sockets.push(socket);
  io.emit('broadcast', { type: "CS", description: clients + ' client(s) connected!' });
  broadcast_chat('', name, 'connect');
  console.log("userID, name: [" + client_id + ", " + name + "] connected!");
  client_id++;
  display_client_list();
  //2 users needed to play a game!
  if (clients >= 2 && gamestate != "running")
  {
    broadcast_start();
    //setInterval(broadcast_start, 60000); //start new round every 60 seconds.
  }
  else if (gamestate == "running")
  {
    //late client needs current information
    //io.to(socket.id).emit('init', {type: "imgData", data: });
    io.to(socket.id).emit('init', {type: "disp_blank", text: current_blanks_disp});
  }
}

function disconnect_client(client_id, io, socket) {
  clients--;
  client_sockets = arrayRemove(client_sockets, socket);
  io.emit('broadcast', { type: "CS", description: clients + ' client(s) connected!' });
  broadcast_chat('', socket.nickname, 'disconnect');
  
  console.log(client_id + " disconnected!");
  display_client_list();
}

function broadcast_image(imgData) {
  io.emit('broadcast', { type: "imgData", data: imgData });
}

function send_clear() {
  io.emit('broadcast', { type: 'clr_cvs' });
}

function broadcast_chat(mesg, user, property) {
  console.log("msg:" + mesg);
  if (mesg.trim() === current_word.trim())
  {
    io.emit('broadcast', { type: 'chat', msg: "", usr: user, property: 'guessed' });
  }
  else
  {
    io.emit('broadcast', { type: 'chat', msg: mesg, usr: user, property: property });
  }
}


function broadcast_start() {
  gamestate = "running";
  var selectedWords = [];
  for (var i = 0; i < 3;)
  {
    var index = Math.floor(Math.random() * words.length-1);
    if (!selectedWords.includes(words[index]))
    {
      selectedWords.push(words[index]);
      i++;
    }

  }
  var drawer_sock = client_sockets[drawer++];
  if (drawer > client_sockets.length - 1)
    drawer = 0;
  
  console.log("Start of round! " + drawer_sock.nickname + " is the current drawer!");
  io.emit('broadcast', { type: 'init', words: selectedWords, drawer: drawer_sock.id});
}

function display_client_list()
{
  process.stdout.write("(" + clients + ") clients connected: [ ")
  for (var i = 0; i < client_sockets.length; i++)
  {
    process.stdout.write("(" + client_sockets[i].id + ", " + client_sockets[i].nickname + ")");
  }
  process.stdout.write("]\n");
}

function arrayRemove(arr, value) {

  return arr.filter(function(ele){
      return ele != value;
  });

}

function broadcast_display_blanks(text)
{
  io.emit('broadcast', { type: 'disp_blank', text: text });
}