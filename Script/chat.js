var socket = io.connect("http://73.98.154.126:8080");
var chatbox = document.getElementById('chatbox');
var chatWindow = document.getElementById('chatWindow');

console.log("chat.js socketID: " + socket.id);
var toggle_bg = 0;

chatbox.addEventListener('keydown', () =>
{
    if ((event.code == "Enter" || event.code == "NumpadEnter") && chatbox.value != "")
        sendText(chatbox.value, socket.nickname);
});

function sendText(msg, user)
{
    socket.emit('server msg', 'chat:' + msg + '\0' + user);
    chatbox.value = "";
}

function receiveText(msg, user)
{
    chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "'>" + user + ": " + msg + "</p>"
    document.getElementById('chatWindow').scrollTop = 1000;

    if (toggle_bg == 0)
        toggle_bg = 1;
    else
        toggle_bg = 0;
    
    
}