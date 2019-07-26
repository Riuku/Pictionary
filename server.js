var PORT = 8080

var server = http.createServer()

var sockjs = require('sockjs')
var wss = sockjs.createServer()
wss.on('connection', function(ws) {
  ws.on('data', function(data) {
    ws.write('from server: ' + data)
  })
  ws.on('close', function() {
    console.log('close')
  })
})

//wss.installHandlers(server)
server.listen(PORT)