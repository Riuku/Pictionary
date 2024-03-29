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
var gamestate = "waiting";
var accepting_start = true;
var canvas_history = [];
var words;
var current_drawer = { name: "undefined" };
var round_timer_hndl;
var next_round_start_hndl;
var roundTime = 60000; //60 seconds
var start_time;
var current_last_rank = 1;

var logging = false;


fs.readFile('word_list.txt', 'utf-8', (err, data) => {
  if (err) throw err;

  words = data.split('\n');
})

router.get('/', function (req, res) {
  res.set("Connection", "keep-alive");
  res.sendFile(path.join(__dirname + '/view/index.html'));
});

router.get('/bug_log.html', function (req, res) {
  res.sendFile(path.join(__dirname + '/view/bug_log.html'));
});

app.use(express.static(__dirname + '/Script'));
app.use(express.static(__dirname + '/images'));
app.use(express.static(__dirname + '/sounds'));

app.use('/', router);

io.on('connection', function (socket) {
  log("a user connected: [" + socket.id + "]")
  socket.on('server msg', function (msg) {
    var decoded = msg.split(':', 1);
    var rest = msg.substring(decoded[0].length + 1);
    //log("server msg type: " + decoded[0]);
    if (decoded[0] == "conn")
      connect_client(socket, rest);
    else if (decoded[0] == "dconn")
      disconnect_client(socket, rest);
    else if (decoded[0] == "imgData") {
      broadcast_image(JSON.parse(rest), socket.id);
    }
    else if (decoded[0] == "clr_cvs")
      send_clear();
    else if (decoded[0] == 'chat') {
      var msg_usr = rest.split('\0');
      broadcast_chat(socket, msg_usr[0], msg_usr[1]);
    }
    else if (decoded[0] == 'word_sel') {
      var blanks_word = rest.split('\0');
      current_blanks_disp = blanks_word[0];
      current_word = blanks_word[1];
      round_start(current_blanks_disp, roundTime);

      log("cw:" + current_word);
    }
    else if (decoded[0] == 'max_rank')
    {
      current_last_rank = rest;
    }

  });

});

http.listen(PORT, function () {
  log('listening on localhost:' + PORT);
});

function connect_client(socket, name) {
  clients++;
  socket.nickname = name;
  client_sockets.push({ id: socket.id, name: name, rank: current_last_rank, score: 0, round_score:0, finished: false });

  log("[" + name + ", " + client_id + "] connected!");
  client_id++;
  //display_client_list();

  io.emit('broadcast', { type: "CS", subtype: "connect", name: name, id: socket.id, gamestate: gamestate, drawer_name: current_drawer.name, last_rank:current_last_rank, player_data:client_sockets, curr_word:current_word });
  broadcast_chat(socket, '', 'connect');


  //2 users needed to play a game!
  if (clients >= 2 && accepting_start) {
    accepting_start = false;
    broadcast_start();
    //setInterval(broadcast_start, 60000); //start new round every 60 seconds.
  }
  else if (gamestate == "choosing" || gamestate == "running") {
    //late client needs current information
    io.emit('broadcast', { type: "draw_hist", usr: socket.id, data: canvas_history });
    var current_time = new Date();
    var elapsed_ms = current_time - start_time;
    var ms_remaining = roundTime - elapsed_ms;
    io.emit('broadcast', { type: 'late_start', drawer: current_drawer.id, usr: socket.id, blanks: current_blanks_disp, time: ms_remaining });

  }
}

function disconnect_client(socket, client_id) {

  if (socket.nickname != undefined) {
    clients--;
    client_sockets = arrayRemove(client_sockets, socket.id);
    io.emit('broadcast', { type: "CS", subtype: "disconnect", name: socket.nickname, id: client_id });
    broadcast_chat(socket, '', 'disconnect');

    if (clients < 2)
      cleanup();
  }

  log("[" + socket.nickname + ", " + client_id + "] disconnected!");
  display_client_list();





}

function broadcast_image(json, source_client_id) {
  
  canvas_history.push(json);
  var type = json.img_type;
  if (type != "fill")
  {
    var start = json.start;
    var end = json.end;
    var color = json.color;
    var width = json.width;
    
    //log("broadcasting to clients: type:imgData img_type:" + type + " start: {" + start.x + ", " + start.y + "} end: {" + end.x + ", " + end.y + "} color: " + color + " width: " + width);
    io.emit('broadcast', { source: source_client_id, type: "imgData", img_type: type, start: start, end: end, color: color, width: width });
  
  } else
  {
    log('sending fill');
    io.emit('broadcast', { source: source_client_id, type: "imgData", img_type: type, DataURL:json.DataURL});//, dx:json.dx, dy:json.dy, w:json.w, h:json.h});
    
  }
}

function send_clear() {
  canvas_history = [];
  io.emit('broadcast', { type: 'clr_cvs' });
}

function send_end_round(permanence) {
  io.emit('broadcast', { type: 'end_round',  permanence:permanence, data:client_sockets, curr_word:current_word});
}

function broadcast_chat(socket, mesg, property) {
  log("msg: '" + mesg + "' username: '" + socket.nickname + "' property: '" + property + "'");

  if (property == 'normal') //prevents disconnects from crashing server.
  {
    var chat_from = arrayFind(client_sockets, socket.id);

    if (chat_from == undefined) {
      log("client_sockets does not contain usr:[" + socket.id + "]");
      return;
    }

    var fin = chat_from[0].finished;
    if (fin) {
      io.emit('broadcast', { type: 'chat', msg: mesg, usr: socket.nickname, property: 'finished' });
      return;
    }
  }

  if (gamestate == "running" && (mesg.trim() === current_word.trim())) {
    guessedWord(socket);

  }
  else {
    io.emit('broadcast', { type: 'chat', msg: mesg, usr: socket.nickname, property: property });
  }
}


function broadcast_start() {

  var selectedWords = [];
  log("selecting words:");
  for (var i = 0; i < 3;) {
    var index = Math.floor(Math.random() * words.length - 1);

    if (!selectedWords.includes(words[index])) {
      selectedWords.push(words[index]);
      log("\trandom word at index:" + index + ", '" + words[index] + "'");
      i++;
    }

  }
  current_drawer = client_sockets[++drawer];
  if (drawer > client_sockets.length - 1) {
    drawer = 0;
    current_drawer = client_sockets[drawer];
  }
  gamestate = "choosing";
  log("gamestate:" + gamestate);
  log("Start of round! " + current_drawer.name + " is the current drawer!");
  io.emit('broadcast', { type: 'init', words: selectedWords, drawer_id: current_drawer.id, drawer_name: current_drawer.name });
}

function display_client_list() {
  process.stdout.write("(" + clients + ") clients connected: [ ")
  for (var i = 0; i < client_sockets.length; i++) {
    process.stdout.write("(" + client_sockets[i].name + ", " + client_sockets[i].id + ")");
  }
  process.stdout.write("]\n");
}

function arrayRemove(arr, id) {

  return arr.filter(function (ele) {
    return ele.id != id;
  });

}

function arrayFind(arr, id) {
  return arr.filter(function (ele) {
    return ele.id == id;
  });
}

function round_start(blanks, time) {
  gamestate = "running";
  log("gamestate:'" + gamestate + "'");
  client_sockets[client_sockets.indexOf(current_drawer)].finished = true;
  io.emit('broadcast', { type: 'round_start', drawer: current_drawer.id, blanks: blanks, time: time, word: current_word });
  round_timer_hndl = setTimeout(endRound, time);
  start_time = new Date();
}

function guessedWord(socket) {
  var sock_obj = arrayFind(client_sockets, socket.id);
  client_sockets[client_sockets.indexOf(sock_obj[0])].finished = true;
  guess_order.push({id:socket.id, round_points:0});
  io.emit('broadcast', { type: 'chat', msg: "", usr_id: socket.id, usr: socket.nickname, property: 'guessed' });

  if (allClientsFinished())
    endRound();

}

function allClientsFinished() {
  var cs = client_sockets.filter((ele) => {
    return ele.finished == false;
  });

  if (cs.length > 0)
    return false;
  else
    return true;

}

function endRound() {
  clearTimeout(round_timer_hndl);
  if (clients >= 2) //game can continue with 2 or more players..
  {
    calculatePoints();
    
    //cleanup post round.
    //send_clear();
    reset_finish_state();
    
    send_end_round(false);
    reset_round_score();
    //clear guess list order
    guess_order = []; 
    
    gamestate = "end_round"
    next_round_start_hndl = setTimeout(broadcast_start, 10000); //start new round after 10 seconds.
    
  } else //no clients are connected, we need to cleanup.
  {
    cleanup();
  }

}

function calculatePoints() {
  var max_point = 500;
  var num_guessed = 0;

  //score for each player who guessed correctly.
  guess_order.forEach((ele) => {
    var c_sock = arrayFind(client_sockets, ele.id);
    c_sock[0].score += max_point;
    c_sock[0].round_score = max_point;
    max_point = Math.floor(max_point / 2);
    num_guessed += 1;
  });

  var drawer_rnd_score = (num_guessed * 150);
  current_drawer.score += drawer_rnd_score; //drawer score
  current_drawer.round_score = drawer_rnd_score;
  
}

function cleanup() {
  log("cleaning up server...");
  clearTimeout(round_timer_hndl);
  clearTimeout(next_round_start_hndl);
  send_clear();
  send_end_round(true);
  reset_finish_state();
  reset_round_score();
  gamestate = "waiting";
  guess_order = [];
  drawer = 0;
  accepting_start = true;
  current_drawer = { name: "undefined" };
}

function reset_finish_state()
{
  client_sockets.forEach((el) => {
    el.finished = false;
  });
}

function reset_round_score()
{
  client_sockets.forEach((el) => {
    el.round_score = 0;
  });
}

function log(message)
{
  if (logging)
    console.log(message);
}
