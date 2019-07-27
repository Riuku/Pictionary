var socket = io.connect("http://localhost:8080");
socket.on('disconnect', function()
{
    dconn();
})

socket.on('broadcast', function (json) {
    console.log("recieved broadcast msg: '" + json + "'");
    if (json.type == "imgData")
    {
        console.log("reconstructing imgdata...")
        var img=new Image();
        //console.log("json.data: " + json.data);
        img.onload = ()=>{
            ctx.drawImage(img, 0, 0);
          };
        img.src=json.data;
        
    }
    else if (json.type == "CS")
        document.getElementById('debug').innerHTML = json.description;
    else if (json.type == 'clr_cvs')
        clearBoard(true);
});

window.addEventListener('beforeunload', function(event) {
    console.log("closing!");
    dconn();
})

function dconn()
{
    socket.emit('server msg','dconn:' + socket.id);
}