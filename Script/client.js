var timer_time;
var timer_handle;
var socket = io.connect("http://73.98.154.126:8080");
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
    else if (json.type == 'CS')
    {
        console.log("got CS message! of subtype: " + json.subtype);
        if (json.subtype == "connect")
            playerJoin(json.name, json.id, 0, 1); //score:0, rank:1
        else if (json.subtype == "disconnect")
            playerLeft(json.name, json.id);
    }
    else if (json.type == 'clr_cvs')
        clearBoard(true);
    else if (json.type == 'chat')
        receiveText(json.msg, json.usr, json.property);
    else if (json.type == 'init')
        round_start(json.words, json.drawer);
    else if (json.type == 'round_start') {
        
        timer_time = json.time / 1000; //seconds
        update_timer();
        timer_handle = setInterval(update_timer, 1000);
        setTimeout(round_timer_end, json.time);

        if (socket.id == json.drawer) {
            display_blanks(json.word);
        } else
        {
            display_blanks(json.blanks);
        }
    }
    else if (json.type == 'draw_hist') {
        if (socket.id == json.usr)
            update_draw_history(json.data);
    }
    else if (json.type == "update_players")
    {
        if (socket.id == json.usr)
            update_player_panel(json.data);
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
time_ctx.font = "170px Comic Sans MS";
time_ctx.fillStyle = "red";
time_ctx.textAlign = "center";

function update_timer() {
    console.log("current timer: " + timer_time);
    time_ctx.clearRect(0,0, timer_disp_canvas.width, timer_disp_canvas.height);
    time_ctx.fillText(timer_time, 160, 160);
    timer_time -= 1;
}

function round_timer_end() {
    console.log("TIME END");
    clearInterval(timer_handle);
}
/* #endregion TIMER*/

var player_panel = document.getElementById("player_panel");
function playerJoin(name, id, score, rank)
{
    enter_lobby();
    console.log("adding player[" + name + ", " + id +  "] to player panel");
    player_panel.innerHTML += 
        "<div id=\"" + id + "\" class=\"player\">\
        <div class=\"rank\">#" + rank + "</div><div class=\"info\">\
        <div class=\"name\">" + name + "</div>\
        <div class=\"score\">Points: " + score + "</div></div></div>";
}

function playerLeft(name, id)
{
    console.log("removing player[" + name + ", " + id +  "] from player panel");
    // Removes an element from the document
    var element = document.getElementById(id);
    element.parentNode.removeChild(element);
}

function update_player_panel(player_data)
{
    for (var i = 0; i < player_data.length; i++)
    {
        var player = player_data[i];
        if (player.id != socket.id)
        {
            playerJoin(player.name, player.id, player.score, player.rank);
        }
    }
}