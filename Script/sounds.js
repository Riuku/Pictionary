var muted = false;

function enter_lobby() {

    var audio = new Audio("join_lobby.wav");
    if (!muted) {
        console.log("playing join_lobby.wav audio!");
        audio.play();
    }
}

var mute_button = document.getElementById('mute');
function toggleMute() {
    if (muted == false) {
        muted = true;
        mute_button.style.backgroundImage = 'url(mute.jpg)';
    } else {
        muted = false;
        mute_button.style.backgroundImage = 'url(unmute.jpg)';

    }
}