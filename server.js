var http = require("http");
var PORT = 8080

var server = http.createServer()
const WebSocket = require('ws');
var socket = new WebSocket("ws://localhost:8080");
socket.on('connection', function(event) {
  socket.send("Hello world!");
});

server.listen(PORT)