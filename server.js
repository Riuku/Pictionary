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
var roundTime = 60000; //60 seconds


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
      connect_client(socket, rest);
    else if (decoded[0] == "dconn")
      disconnect_client(socket, rest);
    else if (decoded[0] == "imgData") {
      broadcast_image(JSON.parse(rest));
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
      round_start(current_blanks_disp, roundTime);
      current_word = blanks_word[1];
      console.log("cw:" + current_word);
    }
  });

});

http.listen(PORT, function () {
  console.log('listening on 73.98.154.126:8080');
});

function connect_client(socket, name) {
  clients++;
  socket.nickname = name;
  client_sockets.push(socket);
  io.emit('broadcast', { type: "CS", subtype:"connect", name:name, id:socket.id });
  broadcast_chat('', name, 'connect');
  console.log("[" + name + ", " + client_id + "] connected!");
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
    io.emit('broadcast', {type: "draw_hist", usr: socket.id, data: canvas_history});
    io.emit('broadcast', {type: "disp_blank", usr: socket.id, text: current_blanks_disp});
  }
}

function disconnect_client(socket, client_id) {
  
  clients--;
  client_sockets = arrayRemove(client_sockets, socket);
  console.log("[" + socket.nickname + ", " + client_id + "] disconnected!");
  display_client_list();

  io.emit('broadcast', { type: "CS", subtype:"disconnect", name: socket.nickname, id: client_id });
  broadcast_chat('', socket.nickname, 'disconnect');
  
}

function broadcast_image(json) {
  var type = json.img_type;
  var start = json.start;
  var end = json.end;
  var color = json.color;
  var width = json.width;
  canvas_history.push(json);
  //console.log("broadcasting to clients: type:imgData img_type:" + type + " start: {" + start.x + ", " + start.y + "} end: {" + end.x + ", " + end.y + "} color: " + color + " width: " + width);
  io.emit('broadcast', { type: "imgData", img_type:type, start:start, end:end, color:color, width:width});
}

function send_clear() {
  canvas_history = [];
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
    process.stdout.write("(" + client_sockets[i].nickname + ", " + client_sockets[i].id + ")");
  }
  process.stdout.write("]\n");
}

function arrayRemove(arr, value) {

  return arr.filter(function(ele){
      return ele != value;
  });

}

function round_start(blanks, time)
{
  io.emit('broadcast', { type: 'round_start', usr:"", blanks: blanks, time:time});
}