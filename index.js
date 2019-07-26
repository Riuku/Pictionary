document.getElementById('canvas').addEventListener('mousemove', draw);
document.getElementById('canvas').addEventListener('mousedown', draw);
document.getElementById('canvas').addEventListener('mouseup', mouseRelease);
document.getElementById('canvas').addEventListener('mouseleave', mouseRelease);

var activeDraw = false;
var radius = 15;
var brushColor = "#000000"; //black
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext("2d");
var previewCanvas = document.getElementById('preview');
var brushMode = 0; //0 = brush 1 = fill
function draw(event) {
    if (event.which == 1)
        activeDraw = true;

    if (canvas.getContext) {
        ctx.fillStyle = brushColor;
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        if (activeDraw && brushMode == 0) 
        {
            
            if (event.clientX > rect.left && event.clientX < rect.right && event.clientY < rect.bottom && event.clientY > rect.top) {
                var circle = new Path2D(); 
                circle.arc(x, y, radius, 0, 2 * Math.PI); 
                ctx.fill(circle);
            } 
            
            
        } else if (activeDraw && brushMode == 1)
        {
            if (event.clientX > rect.left && event.clientX < rect.right && event.clientY < rect.bottom && event.clientY > rect.top) {
                var pixel = ctx.getImageData(x,y,1,1).data;
                var t_color = "#" + ("000000" + rgbToHex(pixel[0], pixel[1], pixel[2])).slice(-6);
                //console.log("\t brush_color=" + brushColor + " t_color=" + t_color);
                if (t_color != brushColor)
                {
                    x = Math.floor(x);
                    y = Math.floor(y);
                    Flood_Fill(x, y, t_color, rect);

                }
            }
        }
        
        if (activeDraw)
            send_draw();
        
    }
}

var wsUrl = 'ws://' + window.location.host
var ws = new WebSocket(wsUrl)

ws.onmessage = function(e) {
  console.log(e.data)
}

ws.onopen = function() {
  console.log('opening...')
  ws.send('hello server')
}

ws.onerror = function(error) {
  console.log('WebSocket error ' + error)
  console.dir(error)
}

function send_draw()
{
    
}

function Flood_Fill(x,y, t_color, rect)
{
        var init_x = x;
        var init_y = y;
        //up
        var up_pix = ctx.getImageData(init_x, init_y - 1, 1, 1).data;
        var up_p_color = "#" + ("000000" + rgbToHex(up_pix[0], up_pix[1], up_pix[2])).slice(-6);
        while (up_p_color == t_color && y >= rect.top - 80)
        {
            y--;
            ctx.fillRect(x,y,1,1);
            up_pix = ctx.getImageData(x, y - 1, 1, 1).data;
            up_p_color = "#" + ("000000" + rgbToHex(up_pix[0], up_pix[1], up_pix[2])).slice(-6);
        }
        
        y = init_y;
        
        //down
        var down_pix = ctx.getImageData(init_x, init_y + 1, 1, 1).data;
        var down_p_color = "#" + ("000000" + rgbToHex(down_pix[0], down_pix[1], down_pix[2])).slice(-6);
        while (down_p_color == t_color && y <= rect.bottom)
        {
            y++;
            ctx.fillRect(x,y,1,1);
            down_pix = ctx.getImageData(x, y + 1, 1, 1).data;
            down_p_color = "#" + ("000000" + rgbToHex(down_pix[0], down_pix[1], down_pix[2])).slice(-6);
        }
        y = init_y;
        
        //left
        var left_pix = ctx.getImageData(init_x - 1, init_y, 1, 1).data;
        var left_p_color = "#" + ("000000" + rgbToHex(left_pix[0], left_pix[1], left_pix[2])).slice(-6);
        while (left_p_color == t_color && x >= rect.left - 6)
        {
            x--;
            ctx.fillRect(x,y,1,1);
            left_pix = ctx.getImageData(x - 1, y, 1, 1).data;
            left_p_color = "#" + ("000000" + rgbToHex(left_pix[0], left_pix[1], left_pix[2])).slice(-6);
        }
        x = init_x;

        //right
        var right_pix = ctx.getImageData(init_x + 1, init_y, 1, 1).data;
        var right_p_color = "#" + ("000000" + rgbToHex(right_pix[0], right_pix[1], right_pix[2])).slice(-6);
        while (right_p_color == t_color && x <= rect.right)
        {
            x++;
            ctx.fillRect(x,y,1,1);
            right_pix = ctx.getImageData(x + 1, y, 1, 1).data;
            right_p_color = "#" + ("000000" + rgbToHex(right_pix[0], right_pix[1], right_pix[2])).slice(-6);
        }
        x = init_x;
}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

window.onblur = function() {
    activeDraw = false;
}
function drawPreview()
{

    if (previewCanvas.getContext) {
        var p_ctx = previewCanvas.getContext("2d");
        p_ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height); 

        p_ctx.fillStyle = "#000000";
        var border = new Path2D();
        border.arc(previewCanvas.width/2, previewCanvas.height/2, radius, 0, 2 * Math.PI);
        p_ctx.fill(border);

        p_ctx.fillStyle = brushColor;
        var circle = new Path2D();
        circle.arc(previewCanvas.width/2, previewCanvas.height/2, radius, 0, 2 * Math.PI);
        p_ctx.fill(circle);

        
    }

    initCanvas();
}
function mouseRelease(event)
{
    if (event.which == 1)
        activeDraw = false;
}
function initCanvas()
{
    var rect = canvas.getBoundingClientRect();
    var pixelArr = ctx.getImageData(0,0, rect.right, rect.bottom).data;
    pixelArr.fill(255, 0, 10000);
}
function changeBrush() {
    brushMode = 0;
    //document.getElementById("canvas").style.cursor = "url('../brush_32.png')";
}

function changeFill() {
    brushMode = 1;
    //document.getElementById("canvas").style.cursor = "url('../paintcan_32.png')";
}


function clearBoard()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);   
}

function updateRadius(event)
{
    radius = document.getElementById("slider").value;
    drawPreview();
}

function changeColor(color)
{
    brushColor = color;
    drawPreview();
}

