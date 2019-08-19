var timer_time;
var timer_tick_handle;
var timer_end_handle;
var player_toggle = 1;
var gamestate;

var ol_waiting = document.getElementById("overlay_waiting");
var ol_waiting_text = document.getElementById("ol_waiting");
ol_waiting_text.innerHTML = "Waiting for more players to join...";

var ol_choosing = document.getElementById("overlay_choosing");
var ol_choosing_text = document.getElementById("ol_choosing");


var ol_end = document.getElementById("overlay_end");
var ol_end_text = document.getElementById("ol_end");
var socket = io.connect("http://localhost:8080");
socket.on('disconnect', function () {
    dconn();
})

socket.on('broadcast', function (json) {
    //console.log("recieved broadcast msg of type: '" + json.type + "'");
    if (json.type == "imgData") {

        if (json.img_type == "point") {
            //console.log("drawing point");
            srv_drawPoint(json.start.x, json.start.y, json.color, json.width);
        } else if (json.img_type == "path") {
            //console.log("drawing path");
            srv_drawPath(json.start.x, json.start.y, json.end.x, json.end.y, json.color, json.width);
        }

    }
    else if (json.type == 'CS') {
        console.log("got CS message! of subtype: " + json.subtype);
        if (json.subtype == "connect") {

            if (socket.id != json.id) {
                //play lobby sound effect if connection did not originate from self.
                enter_lobby();

                //add any incomming connections
                playerJoin(false, json.name, json.id, 0, json.last_rank);
            } else {
                //self connection

                gamestate = json.gamestate;
                console.log("gamestate:'" + gamestate + "'");
                if (json.gamestate == "waiting") {
                    ol_waiting.style.display = "block";

                } else if (json.gamestate == "choosing") {
                    ol_choosing_text.innerHTML = json.drawer_name + " is choosing a word...";
                    ol_choosing.style.display = "block";

                } else if (json.gamestate == "end_round") {
                    display_end_of_round(json.player_data, json.curr_word);
                }
                playerJoin(true, json.name, json.id, 0, json.last_rank); //add self
                update_player_panel(json.player_data); //add pre-existing clients

            }

        }
        else if (json.subtype == "disconnect")
            playerLeft(json.name, json.id);
    }
    else if (json.type == 'clr_cvs')
        clearBoard(true);
    else if (json.type == 'chat')
        receiveText(json.msg, json.usr, json.usr_id, json.property);
    else if (json.type == 'init')
        round_start(json.words, json.drawer_id, json.drawer_name);
    else if (json.type == 'round_start') {
        ol_choosing.style.display = "none";
        modify_player_panel(json.drawer);
        timer_blank_info(json.time, json.drawer, json.blanks, json.word);
    }
    else if (json.type == 'late_start') {
        if (socket.id == json.usr && gamestate == "running") {
            timer_blank_info(json.time, json.drawer, json.blanks, json.word);
        }
    }
    else if (json.type == 'draw_hist') {
        if (socket.id == json.usr)
            update_draw_history(json.data);
    }
    else if (json.type == "end_round") {
        if (json.permanence) {
            word_prompt_modal.style.display = "none";
            ol_choosing.style.display = "none";
            ol_end.style.dispaly = "none";
            ol_waiting.style.display = "block";
            
            display_blanks('');
            current_drawer = false;
            drawing_controls.style.visibility = "hidden";
            clearTimeout(select_word_timeout_handle);


        } else {

            

            display_end_of_round(json.data, json.curr_word);
            update_client_data(json.data);
        }

        fin = false;
        round_timer_end();

    }
});

window.addEventListener('beforeunload', function (event) {
    console.log("closing!");
    dconn();
})

function dconn() {
    socket.emit('server msg', 'dconn:' + socket.id);
}

function srv_drawPoint(x, y, color, width) {
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    var circle = new Path2D();
    circle.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
    ctx.fill(circle);
}

function srv_drawPath(x1, y1, x2, y2, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(x1, y1);

    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function update_draw_history(history) {
    for (var i = 0; i < history.length; i++) {
        var piece = history[i];
        if (piece.img_type == "point") {
            srv_drawPoint(piece.start.x, piece.start.y, piece.color, piece.width);
        } else if (piece.img_type == "path") {
            srv_drawPath(piece.start.x, piece.start.y, piece.end.x, piece.end.y, piece.color, piece.width);
        }
    }
}

/* #region TIMER*/
var timer_disp_canvas = document.getElementById("timer_disp");

var time_ctx = timer_disp_canvas.getContext('2d');
time_ctx.font = "120px Comic Sans MS";
time_ctx.fillStyle = "black";
time_ctx.textAlign = "center";

function update_timer() {
    //console.log("current timer: " + timer_time);
    time_ctx.clearRect(0, 0, timer_disp_canvas.width, timer_disp_canvas.height);
    time_ctx.fillText(timer_time, 160, 117);
    timer_time -= 1;
}

function round_timer_end() {
    //console.log("TIME END");
    clearTimeout(timer_end_handle);
    clearInterval(timer_tick_handle);
    time_ctx.clearRect(0, 0, timer_disp_canvas.width, timer_disp_canvas.height);

}
/* #endregion TIMER*/

var player_panel = document.getElementById("player_panel");
function playerJoin(self, name, id, score, rank) {

    var element = document.getElementById(id);
    if (element === null) {
        var name_color = "black";
        if (self) {
            name = name + " (you)";
            name_color = "blue";
        }



        console.log("self: " + self + " adding player[" + name + ", " + id + "] to player panel");
        player_panel.innerHTML +=
            "<div id=\"" + id + "\" class=\"player_" + player_toggle + "\">\
            <div class=\"rank\">#" + rank + "</div>\
            <div class=\"drawer_icon\"></div>\
            <div class=\"info\">\
            <div class=\"name\" style=\"color:" + name_color + ";\">" + name + "</div>\
            <div class=\"score\">Points: " + score + "</div></div></div>";

        if (player_toggle == 0)
            player_toggle = 1;
        else
            player_toggle = 0;
    } else
        console.log("we've hit a race condition scenario!");

}

function playerLeft(name, id) {
    console.log("removing player[" + name + ", " + id + "] from player panel");
    // Removes an element from the document
    var element = document.getElementById(id);
    element.parentNode.removeChild(element);
}

function update_player_panel(player_data) {
    for (var i = 0; i < player_data.length; i++) {
        var conn_player = player_data[i];
        if (conn_player.id != socket.id) {
            playerJoin(false, conn_player.name, conn_player.id, conn_player.score, conn_player.rank);
        }
    }
}

function update_client_data(client_data) {

    //sort scores in descending order.
    client_data.sort((a, b) => {
        return b.score - a.score;
    });
    var rank = 1;
    var previous = client_data[0].score;
    client_data.forEach((el) => {
        var container = document.getElementById(el.id);
        var score_element = container.querySelector('.score');
        score_element.innerHTML = "Points: " + el.score;

        var rank_element = container.querySelector('.rank');
        if (previous != el.score) {
            rank++;
        }
        previous = el.score;
        rank_element.innerHTML = "#" + rank;

    });
    socket.emit('server msg', 'max_rank:' + rank);

}

function display_end_of_round(client_data, word) {
    //sort round_scores in descending order.
    client_data.sort((a, b) => {
        return b.round_score - a.round_score;
    });

    ol_end_text.innerHTML = "<p>Word was: " + word + "</p>"
    client_data.forEach((el)=>
    {
        ol_end_text.innerHTML += "<p>" + el.name + "\t" + el.round_score + "</p>"
    });
    ol_end.style.display = "block";
}

function timer_blank_info(current_time, drawer, blanks, word) {
    console.log("updating timer info");
    timer_time = Math.round(current_time / 1000);
    update_timer();
    timer_tick_handle = setInterval(update_timer, 1000);
    timer_end_handle = setTimeout(round_timer_end, current_time);

    if (socket.id == drawer) {
        display_blanks(word);
    } else {
        display_blanks(blanks);
    }
}
function show_modal(modal_name) {
    var modal = document.getElementById(modal_name);
    modal.style.display = "block";
}
function close_modal(modal_name) {
    var modal = document.getElementById(modal_name);
    modal.style.display = "none";
}
