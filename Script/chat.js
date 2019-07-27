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

    chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "'>" + user + ": " + msg + "</p>"
    document.getElementById('chatWindow').scrollTop = 1000;

    if (toggle_bg == 0)
        toggle_bg = 1;
    else
        toggle_bg = 0;
    
    chatbox.value = "";
}