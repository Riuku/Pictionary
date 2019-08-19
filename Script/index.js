var activeDraw = false;
var brushColor = "#000000"; //black
var brushWidth = 15;
var canvas;
var rect;
var ctx;
var previewCanvas = document.getElementById('preview');
var brushMode = 0; //0 = brush 1 = fill
var current_drawer = false;

function init() {
    $(document).ready(function(){
   
        $('#bug_log').load("bug_log.html");
     
     });

    // Get the canvas and the drawing context.
    canvas = document.getElementById("canvas");
    rect = canvas.getBoundingClientRect();
    ctx = canvas.getContext("2d");

    //default line width 15 pixels;
    ctx.lineWidth = brushWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Attach the events that you need for drawing.
    canvas.onmousedown = startDraw;
    canvas.onmouseup = mouseRelease;
    canvas.onmouseout = mouseRelease;
    canvas.onmousemove = draw;
    canvas.onmouseenter = startDraw;
    document.onmouseup = doc_mouseRelease;

    drawPreview();
    promptForName();
}

// Get the modal
var name_prompt_modal = document.getElementById("name_prompt_modal");
var name_prompt = document.getElementById("name_prompt");

function promptForName() {
    name_prompt_modal.style.display = "block";
}



function Play() {
    if (name_prompt.value != "") {
        name_prompt_modal.style.display = "none";
        socket.nickname = name_prompt.value;
        socket.emit("server msg", "conn:" + name_prompt.value);

    }
}
var previousPoint = {x:-1,y:-1};
var startPoint = {x:-1,y:-1};
function startDraw(e) {
    if (current_drawer)
    {
        if ((e.which == 1 || activeDraw) && brushMode == 0) //detects left click on chrome browsers
        {
            //console.log("event click: (x,y): (" + e.pageX + ", " + e.pageY + ")");
            activeDraw = true;
    
            // Create a new path (with the current stroke color and stroke thickness).
            ctx.beginPath();
        
            // Put the pen down where the mouse is positioned.
            var x = e.offsetX;
            var y = e.offsetY;
    
            ctx.moveTo(x, y);
            //console.log("canvas position: (x,y): (" + x + ", " + y + ")");
            //store previous point for sending network updates
            previousPoint = startPoint = {x: x, y: y};
        } else if (e.type == 'mousedown' && brushMode == 1)
        {

            
            //get mouse positioning relative to control.
            var x = e.offsetX;
            var y = e.offsetY;

            var pixel = ctx.getImageData(x,y,1,1).data;
            var t_color = "#" + ("000000" + rgbToHex(pixel[0], pixel[1], pixel[2])).slice(-6);
            if (t_color != brushColor)
            {
                Fill_Region(x,y);
                console.log("fill tool!");
            }
            
        }
    }
    
    
}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

function draw(e) {
    if (e.which == 1 && current_drawer) //detects left click on chrome browsers
    {
        
        ctx.strokeStyle = brushColor;
        
        var x = e.offsetX;
        var y = e.offsetY;
        //console.log("stroke to: (" + x + ", " + y + ")");
        if (activeDraw) {
    
            if (x > 0 && x < rect.width && y < rect.height && y > 0) {
                ctx.lineTo(x, y);
                ctx.stroke();
    
    
                send_draw_updates("path", previousPoint, {x:x, y:y}, brushColor, ctx.lineWidth);
                previousPoint = {x:x, y:y};
            }
    
    
        }
    }
    
}

function Fill_Region(x,y)
{

}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

window.onblur = function () {
    activeDraw = false;
}
function drawPreview() {

    if (previewCanvas.getContext) {
        var p_ctx = previewCanvas.getContext("2d");
        p_ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        p_ctx.fillStyle = "#000000";
        var border = new Path2D();
        border.arc(previewCanvas.width / 2, previewCanvas.height / 2, ctx.lineWidth / 2, 0, 2 * Math.PI);
        p_ctx.fill(border);

        p_ctx.fillStyle = brushColor;
        var circle = new Path2D();
        circle.arc(previewCanvas.width / 2, previewCanvas.height / 2, ctx.lineWidth / 2, 0, 2 * Math.PI);
        p_ctx.fill(circle);


    }
}
function mouseRelease(e) {
    
    if (current_drawer)
    {
        var x = e.offsetX;
        var y = e.offsetY;
        var endPoint = {x:x, y:y};
    
        if (startPoint.x == endPoint.x && startPoint.y == endPoint.y) //we know that this isnt the result of a path, but a single click.
        {
            ctx.fillStyle = brushColor;
            var circle = new Path2D();
            circle.arc(x,y, ctx.lineWidth / 2, 0, 2 * Math.PI);
            ctx.fill(circle);
            send_draw_updates("point", startPoint, {x:x, y:y}, brushColor, ctx.lineWidth);
        } else if (activeDraw) //it was a path
        {
            ctx.lineTo(x, y);
            ctx.stroke();
    
            send_draw_updates("path", previousPoint, endPoint, brushColor, ctx.lineWidth);
            
        }
        if (event.type == "mouseup")
        {
            console.log("mouse released in canvas!");
            activeDraw = false;
        }
    }
}

function doc_mouseRelease(e)
{
    if (activeDraw && current_drawer)
    {
        console.log("mouse released in document!");
        activeDraw = false;
    }
    
}

var fill_button = document.getElementById("fill");
var brush_button = document.getElementById("brush");
function change_Tool(type)
{
    if (type == "brush")
    {
        brush_button.disabled = true;
        brush_button.style.backgroundColor = 'grey';

        fill_button.disabled = false;
        fill_button.style.backgroundColor = 'white';
        brushMode = 0;
    }
    else if (type == "fill")
    {
        fill_button.disabled = true;
        fill_button.style.backgroundColor = 'grey';

        brush_button.disabled = false;
        brush_button.style.backgroundColor = 'white';
        brushMode = 1;
    }
}


function clearBoard(server_call) {
    if (!server_call)
        socket.emit('server msg', 'clr_cvs:');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

}

function updateRadius(e) {
    brushWidth = ctx.lineWidth = document.getElementById("slider").value;
    drawPreview();
}

function changeColor(color) {
    brushColor = color;
    drawPreview();
}

function send_draw_updates(type, start, end, color, width) {
    var json = {img_type:type, start:start, end:end, color:color, width:width}
    socket.emit('server msg', "imgData:" + JSON.stringify(json));

}


/* #region undo_handler */
var ctrlHeld = false;
window.addEventListener('keydown', (e) => {
    if (e.code == "ControlLeft" || e.code == "ControlRight") {
        ctrlHeld = true;
    }
    if (e.code == "KeyZ" && ctrlHeld)
        undo();
})

window.addEventListener('keyup', (e) => {
    if (e.code == "ControlLeft" || e.code == "ControlRight") {
        ctrlHeld = false;
    }

})

function undo() {
    console.log("undo!");
}
/* #endregion */