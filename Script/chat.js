var chatbox = document.getElementById('chatbox');
var chatWindow = document.getElementById('chatWindow');
var toggle_bg = 0;
var fin = false;

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

function receiveText(msg, user_name, user_id, property)
{
    if (property == 'normal')
    {
        chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "'>" + user_name + ": " + msg + "</p>"
        
    }
    else if (property == 'connect')
    {
        chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "' style='color:#006400;'>'" + user_name + "' has joined!" + "</p>"
    }
    else if (property == 'disconnect')
    {
        chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "' style='color:#B80000;'>'" + user_name + "' has left!" + "</p>"
    }
    else if (property == 'drawing')
    {
        chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "' style='color:#ffd500;'>'" + user_name + "' is drawing!" + "</p>"
    }
    else if (property == 'guessed')
    {
        if (socket.id == user_id)
            fin = true;
        
        chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "' style='color:#CF18E7;'>'" + user_name + "' guessed the word!" + "</p>"

        guessed_player_panel(user_id);
    }
    else if (property == 'finished')
    {
        if (fin)
        {
            chatWindow.innerHTML += "<p class='chat_msg_" + toggle_bg + "' style='color:#19BBE6;'>" + user_name + ": " + msg + "</p>"
        }
    }

    var cw = document.querySelector("#chatWindow");
    var lastChatHeight = cw.querySelectorAll("p");
    chatWindow.scrollTop += lastChatHeight[lastChatHeight.length-1].clientHeight;

    if (toggle_bg == 0)
        toggle_bg = 1;
    else
        toggle_bg = 0;
    
    
}

/**
 * updates player panel background color to green when a user guesses a word correctly
 * 
 * id: the unique socket.id from the triggering player.
 */
function guessed_player_panel(id)
{
    document.getElementById(id).style.background = "green";
}
/**
 * clears any modifications to the player panel at the start of a new round.
 */
function modify_player_panel()
{
    var player_panel = document.getElementById("player_panel");
    var players = player_panel.querySelectorAll('.player_0, .player_1');
    
    players.forEach((el)=>{
        if (el.className == 'player_1')
            el.style.background = '#E3E3E3';
        else if (el.className == 'player_0')
            el.style.background = 'white';
    });
}