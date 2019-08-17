var word_prompt_modal = document.getElementById("word_prompt_modal");

var select_word_timeout_handle;

var current_round_words = [];

var drawing_controls = document.getElementById("drawing_controls");


var container = document.querySelector("#word_prompt_modal");
var modal_content = container.querySelector("div.modal-content");


function round_start(words, drawer_id, drawer_name)
{
    console.log("round start!");
    if (socket.id == drawer_id) //you are the drawer.
    {
        activeDraw = false; //make sure user is not drawing before round starts.
        ctx.lineWidth = brushWidth; //set width back to client_side value. (ctx is updated through network updates?)
        fin = true; //drawer is not allowed to chat to users who haven't yet guessed the word.
        current_round_words = words; //save words for expiring random selection.
        
        

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
        
        ol_choosing.style.display = "block";
        ol_choosing_text.innerHTML = drawer_name + " is choosing a word...";

        //you are not the drawer
        current_drawer = false; //disallow drawing
        drawing_controls.style.visibility = "hidden"; //disable drawing controls

    }
    ol_waiting.style.display = "none";
}

var word_panel = document.getElementById("word_panel");
function set_round_word(word)
{
    clearTimeout(select_word_timeout_handle);
    clearBoard(false); //clear all clients drawing from last round before drawing.

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