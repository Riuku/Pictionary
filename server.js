var client_id = 0;
var clients = 0;
var drawer = 0;
var client_sockets = [];
var guess_order = [];
var PORT = 8080
const path = require('path');
var express = require('express');
const fs = require('fs');
const router = express.Router();
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);
var current_word = "";
var current_blanks_disp = "";
var gamestate = "offline";
var canvas_history = [];
var words;
var current_drawer;
var round_timer_hndl;
var roundTime = 60000; //60 seconds
var start_time;



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

router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/muted.jpg'));
});

router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/unmute.jpg'));
});



app.use(express.static(__dirname + '/Script'));
app.use(express.static(__dirname + '/images'));
app.use(express.static(__dirname + '/sounds'));

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
      broadcast_chat(socket, msg_usr[0], msg_usr[1]);
    }
    else if (decoded[0] == 'word_sel')
    {
      var blanks_word = rest.split('\0');
      current_blanks_disp = blanks_word[0];
      current_word = blanks_word[1];
      round_start(current_blanks_disp, roundTime);
      
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
  client_sockets.push({id: socket.id, name:name, rank:1, score:0, finished:false});
  io.emit('broadcast', { type: "CS", subtype:"connect", name:name, id:socket.id });
  broadcast_chat(socket, '', 'connect');
  console.log("[" + name + ", " + client_id + "] connected!");
  client_id++;
  display_client_list();
  //2 users needed to play a game!
  if (clients >= 2 && (gamestate != "initiated" && gamestate != "running"))
  {
    gamestate = "initiated";
    broadcast_start();
    //setInterval(broadcast_start, 60000); //start new round every 60 seconds.
  }
  else if (gamestate == "initiated" || gamestate == "running")
  {
    //late client needs current information
    io.emit('broadcast', {type: "draw_hist", usr: socket.id, data: canvas_history});
    var current_time = new Date();
    var elapsed_ms = current_time - start_time;
    var ms_remaining = roundTime - elapsed_ms;
    io.emit('broadcast', { type: 'late_start', drawer:current_drawer.id, usr: socket.id, blanks: current_blanks_disp, time:ms_remaining});
    
  }
  //always update every connecting player with all other connections.
  io.emit('broadcast', {type: "update_players", usr: socket.id, data: client_sockets})
}

function disconnect_client(socket, client_id) {
  
  clients--;
  client_sockets = arrayRemove(client_sockets, socket.id);
  console.log("[" + socket.nickname + ", " + client_id + "] disconnected!");
  display_client_list();

  io.emit('broadcast', { type: "CS", subtype:"disconnect", name: socket.nickname, id: client_id });
  broadcast_chat(socket, '', 'disconnect');
  
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

function send_end_round()
{
  io.emit('broadcast', { type: 'end_round' });
}

function broadcast_chat(socket, mesg, property) {
  console.log("msg:" + mesg);
  if (gamestate == "running" && (mesg.trim() === current_word.trim()))
  {
    guessedWord(socket);
    
  }
  else
  {
    io.emit('broadcast', { type: 'chat', msg: mesg, usr: socket.nickname, property: property });
  }
}


function broadcast_start() {
  
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
  current_drawer = client_sockets[++drawer];
  if (drawer > client_sockets.length - 1)
  {
    drawer = 0;
    current_drawer = client_sockets[drawer];
  }
  
  console.log("Start of round! " + current_drawer.name + " is the current drawer!");
  io.emit('broadcast', { type: 'init', words: selectedWords, drawer: current_drawer.id});
}

function display_client_list()
{
  process.stdout.write("(" + clients + ") clients connected: [ ")
  for (var i = 0; i < client_sockets.length; i++)
  {
    process.stdout.write("(" + client_sockets[i].name + ", " + client_sockets[i].id + ")");
  }
  process.stdout.write("]\n");
}

function arrayRemove(arr, id) {

  return arr.filter(function(ele){
      return ele.id != id;
  });

}

function arrayFind(arr, id)
{
  return arr.filter(function(ele) {
    return ele.id == id;
  });
}

function round_start(blanks, time)
{
  gamestate = "running";
  client_sockets[client_sockets.indexOf(current_drawer)].finished = true;
  io.emit('broadcast', { type: 'round_start', drawer:current_drawer.id, blanks: blanks, time:time, word:current_word});
  round_timer_hndl = setTimeout(endRound, time);
  start_time = new Date();
}

function guessedWord(socket)
{
  var sock_obj = arrayFind(client_sockets, socket.id);
  client_sockets[client_sockets.indexOf(sock_obj[0])].finished = true;
  guess_order.push(socket);
  io.emit('broadcast', { type: 'chat', msg: "", usr: socket.nickname, property: 'guessed' });

  if (allClientsFinished())
    endRound();
  
}

function allClientsFinished()
{
  var cs = client_sockets.filter((ele)=>{
    return ele.finished == false;
  });

  if (cs.length > 0)
    return false;
  else
    return true;
  
}

function endRound()
{
  clearInterval(round_timer_hndl);

  calculatePoints();
  broadcast_points();
  //start new round...
  send_clear();

  //reset their finish state for each client.
  client_sockets.forEach((el)=>{
    el.finished=false;
  });

  send_end_round();
  broadcast_start();
}

function calculatePoints()
{
  var max_point = 500;
  var num_guessed = 0;

  //score for each player who guessed correctly.
  guess_order.forEach((ele)=>
  {
    var c_sock = arrayFind(client_sockets, ele.id);
    c_sock[0].score += max_point;
    max_point /= 2;
    num_guessed += 1;
  });

  current_drawer.score += (num_guessed * 150); //drawer score
  guess_order = []; //clear guess list order;
}

function broadcast_points()
{
  io.emit('broadcast', {type:"points", data:client_sockets});
}