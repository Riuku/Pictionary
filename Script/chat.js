var socket = io.connect("http://73.98.154.126:8080");
var chatbox = document.getElementById('chatbox');
var chatWindow = document.getElementById('chatWindow');
var toggle_bg = 0;

chatbox.addEventListener('keydown', () =>
{
    if ((event.code == "Enter" || event.code == "NumpadEnter") && chatbox.value != "")
        sendText(chatbox.value);
});

function sendText(msg)
{
    socket.emit('server msg', 'chat:' + msg + '\0' + 'normal');
    chatbox.value = "";
}

function receiveText(msg, user, property)
{
    if (property == 'normal')
    {
        chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "'>" + user + ": " + msg + "</p>"
        
    }
    else if (property == 'connect')
    {
        chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "' style='color:#006400;'>'" + user + "' has joined!" + "</p>"
    }
    else if (property == 'disconnect')
    {
        chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "' style='color:#B80000;'>'" + user + "' has left!" + "</p>"
    }
    else if (property == 'drawing')
    {
        chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "' style='color:#ffd500;'>'" + user + "' is drawing!" + "</p>"
    }
    else if (property == 'guessed')
    {
        chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "' style='color:#CF18E7;'>'" + user + "' guessed the word!" + "</p>"
    }
    else if (property == 'choosing')
    {
        chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "' style='color:#800080;'>'" + user + "' is currently choosing a word!" + "</p>"

    }

    var cw = document.querySelector("#chatWindow");
    var lastChatHeight = cw.querySelectorAll("p");
    chatWindow.scrollTop += lastChatHeight[lastChatHeight.length-1].clientHeight;

    if (toggle_bg == 0)
        toggle_bg = 1;
    else
        toggle_bg = 0;
    
    
}