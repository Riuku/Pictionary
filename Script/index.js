var activeDraw = false;
var brushColor = "#000000"; //black
var brushWidth = 15;
var canvas;
var ctx;
var previewCanvas = document.getElementById('preview');
var brushMode = 0; //0 = brush 1 = fill
var current_drawer = false;
var logging = false;
var white_fill;

function init() {
    $(document).ready(function () {

        $('#bug_log').load("bug_log.html");

    });

    // Get the canvas and the drawing context.
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d', {alpha: false});
    white_fill = new ImageData(new Uint8ClampedArray(canvas.width * canvas.height * 4).fill(255), canvas.width, canvas.height);
    initBoard();
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
var previousPoint = { x: -1, y: -1 };
var startPoint = { x: -1, y: -1 };
function startDraw(e) {
    if (current_drawer) {
        if ((e.which == 1 || activeDraw) && brushMode == 0) //detects left click on chrome browsers
        {
            //log("event click: (x,y): (" + e.pageX + ", " + e.pageY + ")");
            activeDraw = true;

            // Create a new path (with the current stroke color and stroke thickness).
            ctx.beginPath();

            // Put the pen down where the mouse is positioned.
            var x = e.offsetX;
            var y = e.offsetY;

            ctx.moveTo(x, y);
            //log("canvas position: (x,y): (" + x + ", " + y + ")");
            //store previous point for sending network updates
            previousPoint = startPoint = { x: x, y: y };
        } else if (e.type == 'mousedown' && brushMode == 1) {


            //get mouse positioning relative to control.
            var x = e.offsetX;
            var y = e.offsetY;

            log("click at (" + x + "," + y + ")")

            var image_data = ctx.getImageData(0,0,canvas.width, canvas.height);
            var image_buffer = new Uint8ClampedArray(image_data.data.buffer);
            var pixel_pos = (y * canvas.width + x) * 4;
            var start_color = "#" + ("000000" + rgbToHex(image_buffer[pixel_pos], image_buffer[pixel_pos+1], image_buffer[pixel_pos+2])).slice(-6);

            var new_ctx = Fill_R(x, y, start_color, image_buffer);
            //var smaller_buf = new Uint8ClampedArray(new_ctx.w * new_ctx.h * 4);
            //let start = (new_ctx.dy * canvas.width + new_ctx.dx) * 4;
            //let offset = (new_ctx.h * new_ctx.w) * 4;
            //smaller_buf = new_ctx.buf.slice(start, start + offset);

            //Redraw(smaller_buf, new_ctx.dx, new_ctx.dy, new_ctx.w, new_ctx.h);
            Redraw(new_ctx.buf);//, new_ctx.dx, new_ctx.dy, new_ctx.w, new_ctx.h);

            let json = {img_type: "fill", buf:new_ctx.buf};//buf:smaller_buf, dx:new_ctx.dx, dy:new_ctx.dy, w:new_ctx.w, h:new_ctx.h};
            send_draw_updates(JSON.stringify(json));

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
        //log("stroke to: (" + x + ", " + y + ")");
        if (activeDraw) {

            if (x > 0 && x < canvas.width && y < canvas.height && y > 0) {
                ctx.lineTo(x, y);
                ctx.stroke();

                let json = { img_type: "path", start: previousPoint, end: {x:x, y:y}, color: brushColor, width: ctx.lineWidth };
                send_draw_updates(JSON.stringify(json));
                previousPoint = { x: x, y: y };
            }


        }
    }

}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}
function hexToRgb(hex) {
    hex = hex.replace('#','');
    r = parseInt(hex.substring(0,2), 16);
    g = parseInt(hex.substring(2,4), 16);
    b = parseInt(hex.substring(4,6), 16);
    return {R:r,G:g,B:b};
  }

function Redraw(buffer)//, dx,dy,w,h)
{
    //let imageData = new ImageData(buffer, w, h);
    //ctx.putImageData(imageData,dx,dy);
    let imageData = new ImageData(buffer, canvas.width, canvas.height);
    ctx.putImageData(imageData,0,0);
    log("successfully redrew canvas");
    
}

function Fill_R(x,y, start_color, image_buffer)
{

    if (start_color == brushColor) return;
    var top = 99999;
    var left = 99999;
    var bottom = 0;
    var right = 0;

    var brush_rgb = hexToRgb(brushColor);
    var stack = new Stack();
    stack.push({x:x,y:y});
    while (!stack.isEmpty()) {
        var newPos = stack.pop();
        x = newPos.x;
        y = newPos.y;


        // Go up as long as the color matches and are inside the canvas
        while (y >= 0 &&  get_pixel_color(x,y,image_buffer) == start_color) y -= 1;

        y += 1;
        var reachLeft = false;
        var reachRight = false;
        // Go down as long as the color matches and is inside the canvas
        while (y < canvas.height && get_pixel_color(x,y,image_buffer) == start_color) {

            image_buffer = set_pixel_color(x,y, image_buffer, brush_rgb.R, brush_rgb.G, brush_rgb.B);
            top = Math.min(y, top);
            left = Math.min(x, left);

            bottom = Math.max(y, bottom);
            right = Math.max(x, right);
            if (x > 0) {
                if ( get_pixel_color(x - 1,y,image_buffer) == start_color) {
                    if (!reachLeft) {
                        // Add pixel to stack
                        stack.push({x:(x - 1), y:y});
                        reachLeft = true;
                        
                    }
                } else if (reachLeft) {
                    reachLeft = false;
                }
            }

            if (x < canvas.width) {
                if ( get_pixel_color(x+1,y,image_buffer) == start_color) {
                    if (!reachRight) {
                        // Add pixel to stack
                        stack.push({x:(x + 1), y:y});
                        reachRight = true;
                    }
                } else if (reachRight) {
                    reachRight = false;
                }
            }
            y += 1
        }  
    }
    return {buf:image_buffer}; //, dx:left, dy:top, w:right, h:bottom};
}

function get_pixel_color(x, y, image_buffer)
{
    var pixel_pos = (y * canvas.width + x) * 4;
    return "#" + ("000000" + rgbToHex(image_buffer[pixel_pos], image_buffer[pixel_pos+1], image_buffer[pixel_pos+2])).slice(-6);
}

function set_pixel_color(x,y, image_buffer, R, G, B)
{
    
    var pixel_pos = (y * canvas.width + x) * 4;
    image_buffer[pixel_pos] = R;
    image_buffer[pixel_pos+1] = G;
    image_buffer[pixel_pos+2] = B;
    image_buffer[pixel_pos+3] = 255;
    
    return image_buffer;
}

function log(msg)
{
    if (logging)
        console.log(msg)
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

    if (current_drawer) {
        var x = e.offsetX;
        var y = e.offsetY;
        var endPoint = { x: x, y: y };

        if (startPoint.x == endPoint.x && startPoint.y == endPoint.y) //we know that this isnt the result of a path, but a single click.
        {
            ctx.fillStyle = brushColor;
            var circle = new Path2D();
            circle.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
            ctx.fill(circle);
            let json = { img_type: "point", start: startPoint, end: endPoint, color: brushColor, width: ctx.lineWidth };
            send_draw_updates(JSON.stringify(json));
        } else if (activeDraw) //it was a path
        {
            ctx.lineTo(x, y);
            ctx.stroke();
            let json = { img_type: "path", start: previousPoint, end: endPoint, color: brushColor, width: ctx.lineWidth };
            send_draw_updates(JSON.stringify(json));

        }
        if (event.type == "mouseup") {
            log("mouse released in canvas!");
            activeDraw = false;
        }
    }
}

function doc_mouseRelease(e) {
    if (activeDraw && current_drawer) {
        log("mouse released in document!");
        activeDraw = false;
    }

}

var fill_button = document.getElementById("fill");
var brush_button = document.getElementById("brush");
function change_Tool(type) {
    if (type == "brush") {
        brush_button.disabled = true;
        brush_button.style.backgroundColor = 'grey';

        fill_button.disabled = false;
        fill_button.style.backgroundColor = 'white';
        brushMode = 0;
    }
    else if (type == "fill") {
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
    initBoard();
}

function initBoard()
{
    
    ctx.putImageData(white_fill, 0,0);
}

function updateRadius(e) {
    brushWidth = ctx.lineWidth = document.getElementById("slider").value;
    drawPreview();
}

function changeColor(color) {
    brushColor = color;
    ctx.fillStyle = brushColor;
    drawPreview();
}
function send_draw_updates(data) {
    socket.emit('server msg', "imgData:" + data);

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
    log("undo!");
}
/* #endregion */

// Stack class 
class Stack {

    // Array is used to implement stack 
    constructor() {
        this.items = [];
    }

    // Functions to be implemented 
    // push function 
    push(element) {
        // push element into the items 
        this.items.push(element);
    }


    // pop function 
    pop() {
        // return top most element in the stack 
        // and removes it from the stack 
        // Underflow if stack is empty 
        if (this.items.length == 0)
            return "Underflow";
        return this.items.pop();
    }

    isEmpty() {
        if (this.items.length == 0)
            return true;
        else
            return false;
    }
} 