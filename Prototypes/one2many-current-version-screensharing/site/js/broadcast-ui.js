// Muaz Khan         - www.MuazKhan.com
// MIT License       - www.WebRTC-Experiment.com/licence
// Experiments       - github.com/muaz-khan/WebRTC-Experiment
var checkopen = false;
var config = {
    openSocket: function (config) {
        // https://github.com/muaz-khan/WebRTC-Experiment/blob/master/Signaling.md
        // This method "openSocket" can be defined in HTML page
        // to use any signaling gateway either XHR-Long-Polling or SIP/XMPP or WebSockets/Socket.io
        // or WebSync/SignalR or existing implementations like signalmaster/peerserver or sockjs etc.

        var channel = config.channel || location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');
        var socket = new Firebase('https://webrtc.firebaseio.com/' + channel);
        // var socket = new Firebase('https://chat.firebaseio.com/' + channel);
        socket.channel = channel;
        socket.on('child_added', function (data) {
            config.onmessage(data.val());
        });
        socket.send = function (data) {
            this.push(data);
        };
        config.onopen && setTimeout(config.onopen, 1);
        socket.onDisconnect().remove();
        return socket;
    },
    onRemoteStream: function (media) {
        var video = media.video;

        video.setAttribute('controls', true);
        participants.insertBefore(video, participants.firstChild);

        video.play();
    },
    onRoomFound: function (room) {
        var alreadyExist = document.getElementById(room.broadcaster);
        if (alreadyExist)
            return;

        if (typeof roomsList === 'undefined')
            roomsList = document.body;

        var div = document.createElement('div');
        div.setAttribute('id', room.broadcaster);
        div.innerHTML = '<td>' + room.roomName + '</td>' +
                '<td><button class="join" id="' + room.roomToken + '">Join Room</button></td>';
        roomsList.insertBefore(div, roomsList.firstChild);

        div.onclick = function () {
            div = this;

            captureUserMedia(function () {
                broadcastUI.joinRoom({
                    roomToken: div.querySelector('.join').id,
                    joinUser: div.id
                });
            });
            hideUnnecessaryStuff();
        };
    }
};

var connection = new RTCMultiConnection();
connection.session = {
    screen: true,
    oneway: true
};

var sessions = {};
connection.onNewSession = function (session) {
    // if room is not transmitted once;
    // "onNewSession" will be called multiple times for same session;
    // we need to store session-id in an object.
    if (sessions[session.sessionid])
        return;
    sessions[session.sessionid] = session;

    session.join({
        audio: false
    });
};

connection.onstream = function (e) {
    //participants.appendChild(e.mediaElement);
    document.querySelector('div#participants').appendChild(e.mediaElement);
};
connection.connect();

function createButtonClickHandler() {

    captureUserMedia(function () {
        broadcastUI.createRoom({
            roomName: (document.getElementById('conference-name') || {}).value || 'Anonymous'
        });
    });

    hideUnnecessaryStuff();

    // TODO
    var btn = document.createElement("BUTTON");
    btn.setAttribute("id", "share-screen");
    var t = document.createTextNode("Share Screen");
    btn.appendChild(t);
    document.getElementById('screen-option').appendChild(btn);

    document.getElementById('share-screen').onclick = function () {
        this.disabled = true;
        if (checkopen == false) {
            connection.open();
            checkopen = true;
        } else {
            connection.refresh();
            connection.open();
        }

        document.getElementById('share-screenstop').disabled = false;
    };

    var btn2 = document.createElement("BUTTON");
    btn2.setAttribute("id", "share-screenstop");
    var s = document.createTextNode("Share Screen stop");
    btn2.appendChild(s);
    document.getElementById('screen-option').appendChild(btn2);
    document.getElementById('share-screenstop').disabled = true;

    document.getElementById('share-screenstop').onclick = function () {
        this.disabled = true;
        document.getElementById('share-screen').disabled = false;
        connection.leave();

    };
}


function captureUserMedia(callback) {
    var video = document.createElement('video');
    video.setAttribute('autoplay', true);
    video.setAttribute('controls', true);
    participants.insertBefore(video, participants.firstChild);

    getUserMedia({
        video: video,
        onsuccess: function (stream) {
            config.attachStream = stream;

            callback && callback();
            video.setAttribute('muted', true);

        },
        onerror: function () {
            alert('unable to get access to your webcam.');
            callback && callback();
        }
    });
}


/* on page load: get public rooms */
var broadcastUI = broadcast(config);


/* UI specific */
var participants = document.getElementById("participants") || document.body;
var startConferencing = document.getElementById('start-conferencing');
var roomsList = document.getElementById('rooms-list');


if (startConferencing)
    startConferencing.onclick = createButtonClickHandler;

function hideUnnecessaryStuff() {
    var visibleElements = document.getElementsByClassName('visible'),
            length = visibleElements.length;
    for (var i = 0; i < length; i++) {
        visibleElements[i].style.display = 'none';
    }
}

(function () {
    var uniqueToken = document.getElementById('unique-token');
    if (uniqueToken)
        if (location.hash.length > 2)
            uniqueToken.parentNode.parentNode.parentNode.innerHTML = '<h2 style="text-align:center;"><a href="' + location.href + '" target="_blank">Share this link</a></h2>';
        else
            uniqueToken.innerHTML = uniqueToken.parentNode.parentNode.href = '#' + (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '-');
})();