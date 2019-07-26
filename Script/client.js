var socket = io();
socket.on('broadcast', function (data) {
    $('debug').innerHTML = data.description;
});