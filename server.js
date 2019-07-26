var clients = 0;

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

//app.use(express.static(__dirname+'/view'));
app.use(express.static(__dirname+'/Script'));
app.use(express.static(__dirname+'/images'));

app.use('/', router);

io.on('connect', function(socket) {
  clients++;
  io.emit('broadcast',{ description: clients + ' clients connected!'});
  socket.on('disconnect', function () {
     clients--;
     io.emit('',{ description: clients + ' clients connected!'});
     io.emit()
  });
});

http.listen(PORT, function() {
  console.log('listening on localhost:8080');
});

