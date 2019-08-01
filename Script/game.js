var socket = io.connect("http://73.98.154.126:8080");
function game_start()
{
    socket.emit('server msg', 'start:')
}

function round_start(words, drawer)
{
    console.log("round start!");
    if (socket == drawer)
    {
        socket.emit('server msg', 'chat:I am the drawer!' + '\0' + socket.nickname + '\0' + 'normal');
    }
    else
    {
        socket.emit('server msg', 'chat:I am NOT the drawer!' + '\0' + socket.nickname + '\0' + 'normal');
    }
}