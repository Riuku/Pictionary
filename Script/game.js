var socket = io.connect("http://73.98.154.126:8080");
var word_prompt_modal = document.getElementById("word_prompt_modal");

function round_start(words, drawer)
{
    console.log("round start!");
    if (socket.id == drawer)
    {
        socket.emit('server msg', 'chat:' + '\0' + socket.nickname + '\0' + 'drawing');
        
        var container = document.querySelector("#word_prompt_modal");
        var modal_content = container.querySelector("div.modal-content")

        var paragraph = document.createElement('p');
        paragraph.appendChild(document.createTextNode("Select a word:"));
        modal_content.appendChild(paragraph);
        word_prompt_modal.style.display = "block";
        words.forEach((element)=>{
            var button_input = document.createElement('input');
            button_input.setAttribute('type', 'button');
            button_input.value = element;
            button_input.onclick = function() {set_round_word(element)};
            modal_content.appendChild(button_input);
        });
        
        
    }
    else
    {
        
    }
}

var word_panel = document.getElementById("word_panel");
function set_round_word(word)
{
    console.log("chosen word: " + word);
    word_prompt_modal.style.display = "none";
    var display_str = "";
    for (var i = 0; i < word.length-1; i++)
    {
        display_str += "_ ";
    }
    socket.emit('server msg', 'disp_blank:' + display_str);

    
}

function display_blanks(display_str)
{
    word_panel.innerHTML = display_str;
}