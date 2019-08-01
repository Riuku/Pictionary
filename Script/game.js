var socket = io.connect("http://73.98.154.126:8080");
var word_prompt_modal = document.getElementById("word_prompt_modal");

function round_start(words, drawer)
{
    console.log("round start!");
    if (socket.id == drawer)
    {
        socket.emit('server msg', 'chat:' + '\0' + socket.nickname + '\0' + 'drawing');
        
        var container = document.querySelector("#word_prompt_modal");
        container.querySelector("div.modal-content").innerHTML =
        '<p>Select a word:</p>' +
            '<input type=\'button\' value=\'' + words[0] + '\' onclick=set_round_word(' + words[0] + ')></input>' +
            '<input type=\'button\' value=\'' + words[1] + '\' onclick=set_round_word(' + words[1] + ')></input>' +
            '<input type=\'button\' value=\'' + words[2] + '\' onclick=set_round_word(' + words[2] + ')></input>';

        word_prompt_modal.style.display = "block";
        
    }
    else
    {
        
    }
}

var word_panel = document.getElementById("word_panel");
function set_round_word(word)
{
    alert("chosen word: " + word);
    var display_str = "";
    for (var i = 0; i < word.length; i++)
    {
        display_str += "_ ";
    }
    console.log("word_panel.innerHTML= " + display_str);
    word_panel.innerHTML = display_str;

    word_prompt_modal.style.display = "none";
}