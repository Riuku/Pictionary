var timer_time;
var timer_handle;
var socket = io.connect("http://73.98.154.126:8080");
socket.on('disconnect', function () {
    dconn();
})

socket.on('broadcast', function (json) {
    console.log("recieved broadcast msg of type: '" + json.type + "'");
    if (json.type == "imgData") {

        if (json.img_type == "point") {
            console.log("drawing point");
            srv_drawPoint(json.start.x, json.start.y, json.color, json.width);
        } else if (json.img_type == "path") {
            console.log("drawing path");
            srv_drawPath(json.start.x, json.start.y, json.end.x, json.end.y, json.color, json.width);
        }

    }
    else if (json.type == 'CS')
        document.getElementById('debug').innerHTML = json.description;
    else if (json.type == 'clr_cvs')
        clearBoard(true);
    else if (json.type == 'chat')
        receiveText(json.msg, json.usr, json.property);
    else if (json.type == 'init')
        round_start(json.words, json.drawer);
    else if (json.type == 'round_start') {
        if (socket.id == json.usr || json.usr == "") {
            display_blanks(json.blanks);
            timer_time = json.time / 1000; //seconds
            update_timer();
            timer_handle = setInterval(update_timer, 1000);
            setTimeout(round_timer_end, json.time);
        }
    }
    else if (json.type == 'draw_hist') {
        if (socket.id == json.usr)
            update_draw_history(json.data);
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