var socket = io.connect("http://73.98.154.126:8080");
var word_prompt_modal = document.getElementById("word_prompt_modal");

var select_word_timeout_handle;

var current_round_words = [];

var drawing_controls = document.getElementById("drawing_controls");


var container = document.querySelector("#word_prompt_modal");
var modal_content = container.querySelector("div.modal-content");
function round_start(words, drawer)
{
    console.log("round start!");
    if (socket.id == drawer)
    {
        current_round_words = words;
        //send to other clients to let them know you are currently choosing a word.
        socket.emit('server msg', 'chat:' + '\0' + 'choosing');
        
        

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
        
        select_word_timeout_handle = setTimeout(selectionExpired, 10000); //10 seconds to choose a word.
    }
    else
    {
        //you are not the drawer this round.
        current_drawer = false; //disallow drawing
        drawing_controls.style.visibility = "hidden"; //disable drawing controls

    }
}

var word_panel = document.getElementById("word_panel");
function set_round_word(word)
{
    clearTimeout(select_word_timeout_handle);
    //send to other clients to let them know you are currently drawing.
    socket.emit('server msg', 'chat:' + '\0' + 'drawing');

    console.log("chosen word: " + word);
    word_prompt_modal.style.display = "none"; //close word prompt

    modal_content.innerHTML = ""; //clear previous modal content.

    drawing_controls.style.visibility = "visible"; //enable drawing controls
    current_drawer = true; //allow drawing

    var display_str = "";
    for (var i = 0; i < word.length-1; i++)
    {
        display_str += "_ ";
    }
    socket.emit('server msg', 'word_sel:' + display_str + '\0' + word);

    
}

function display_blanks(display_str)
{
    word_panel.innerHTML = display_str;
}

function selectionExpired()
{
    var randWord_index = Math.floor(Math.random() * current_round_words.length);
    set_round_word(current_round_words[randWord_index]);
}