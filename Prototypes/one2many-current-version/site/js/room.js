var lat;
var lon;
var check = false;

// Initialisation des modal Jquery UI
$(document).ready(function () {
    $("#download").dialog({title: "Vous a envoyé un fichier", height: 200, width: 400, modal: true});

    $("#download").dialog('close');

    $("#senddownload").dialog({title: "Envoi de fichiers", height: 200, width: 400, modal: true});

    $("#senddownload").dialog('close');

    $("#popsend").click(function () {
        $("#senddownload").dialog({title: "Envoi de fichiers", height: 450, width: 600, modal: true});
        $("#progressbar").progressbar({
            value: 0
        });
    })
});

if (navigator.geolocation)
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
else
    alert("Votre navigateur ne prend pas en compte la géolocalisation HTML5");

function successCallback(position) {
    lat = position.coords.latitude;
    lon = position.coords.longitude;
}
;

function errorCallback(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("L'utilisateur n'a pas autorisé l'accés à sa position");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("L'emplacement de l'utilisateur n'a pas pu être détérminé");
            break;
        case error.TIMEOUT:
            alert("Le service n'a pas répondu à temps");
            break;
    }
}
;

// On demande le pseudo, on l'envoie au serveur et on l'affiche dans le titre
var pseudo = prompt('Quel est votre pseudo ?');
// Timer pour avoir le temsp de récupérer la position 
sleep(10000);
var Draggabilly = require('draggabilly');

// Connexion à socket.io
var socket = io.connect();
var ss = require('socket.io-stream');
ss.forceBase64 = true;


socket.emit('nouveau_client', pseudo);

$(function () {

    $('#file').change(function (e) {
        var fullPath = document.getElementById('file').value;
         $('combo_users').disabled =true; 
        var filename;
        if (fullPath) {
            var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
            filename = fullPath.substring(startIndex);
            if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
                filename = filename.substring(1);
            }
        }
        var file = e.target.files[0];
        var stream = ss.createStream();

        var stream = ss.createStream();

        // Upload des fichiers sur le serveur pour l'envoyer 
        ss(socket).emit('profile-image', stream, {size: file.size, name: filename}, pseudo);
        var blobStream = ss.createBlobReadStream(file);
        var size = 0;

        blobStream.on('data', function (chunk) {
            size += chunk.length;
            console.log(Math.floor(size / file.size * 100) + '%');
            $("#progressbar").progressbar({
                value: Math.floor(size / file.size * 100)
            });
            if (Math.floor(size / file.size * 100) == 100) {
                var e = document.getElementById("combo_users");
                var usersend = e.options[e.selectedIndex].value;
                socket.emit('validefile', filename, pseudo, usersend);
                $("#senddownload").dialog('close');
                document.getElementById("file").value = "";
            }
        });

        blobStream.pipe(stream);
    });
});

// Procédure lors de la réception d'un fichier.
socket.on('receivefile', function (file, pseudo) {
    $("#download").dialog({title: pseudo + " veut vous envoyer un fichier", height: 250, width: 450, open: function (event, ui) {
            $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide();
        }, modal: true});
    document.getElementById('downloadinfo').innerHTML = "<p>" + file + "</p>"
    document.getElementById('downloadinfo').innerHTML = document.getElementById('downloadinfo').innerHTML + "<center>";
    document.getElementById('downloadinfo').innerHTML = document.getElementById('downloadinfo').innerHTML + "<input type=button id=\"accept\" onClick=\"location.href='/send/" + file + "\'\"   value=\' Accepter\'>" + " " + "<input type=button onClick=\"location.href='/delete/" + file + "\'\" id= \"decline\" value=\' Refuser\'>";
    document.getElementById('downloadinfo').innerHTML = document.getElementById('downloadinfo').innerHTML + "</center>";
    $("#accept").click(function () {
        $("#download").dialog('close');
    })
    $("#decline").click(function () {
        $("#download").dialog('close');
    })
});



$("#popMap").click(function () {
    if ((lat) && (check == false)) {
        socket.emit('nouvelle_position', pseudo, lat, lon);
        check = true;
    }
    socket.emit('receiveposition');

});
document.title = pseudo + ' - ' + document.title;

// On créer l'évenement recupererParticipants pour récupérer directement les participants sur le serveur
socket.on('recupererParticipants', function (participants) {
    //réinitialisation de la liste des participants au niveau graphique lors des éventuelles maj de cette dernière
    $('#list_parts').children('li').remove();
    $('#combo_users').children('option').remove();
    // participants est le tableau contenant tous les participants qui ont se sont inscrit sur le serveur
    for (var i = 0; i < participants.length; i++) {
        $('#list_parts').prepend('<li><em>' + participants[i] + '</em></li>');
        $("#combo_users").prepend("<option>" + participants[i] + "</option>");
    }
});

// Quand on reçoit un message, on l'insèrre dans la page
socket.on('message', function (data) {
    insereMessage(data.pseudo, data.message);
})

// Quand un nouveau client se connecte, on affiche l'information
socket.on('nouveau_client', function (pseudo) {
    $('#list_chat').prepend('<li><em>' + pseudo + ' a rejoint la conversation !</em></li>');
    $('#list_parts').prepend('<li><em>' + pseudo + '</em></li>');
    $("#combo_users").prepend("<option>" + pseudo + "</option>");
})

// Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
$('#formulaire_chat').submit(function () {
    var message = $('#message').val();
    socket.emit('message', message); // Transmet le message aux autres
    insereMyMessage(pseudo, message); // Affiche le message aussi sur notre page
    $('#message').val('').focus(); // Vide la zone de Chat et remet le focus dessus
    return false; // Permet de bloquer l'envoi "classique" du formulaire
});

// Ajoute un message venant de l'exterieur
function insereMessage(pseudo, message) {
    $('#list_chat').prepend('<li class="block-recu"> <div class="pseudo-recu">' + pseudo + '</div> <div class="message-recu">' + message + '</div></li>');

    // Supprime l'ancienne notification
    $('#contener').children('.notif').remove();
    // Affiche la nouvelle notification
    $('#contener').append('<img id="notif" class="notif" alt="notif" src="../../img/notification.png" />');
    // Si le chat est ouvert, on supprime la notif
    if ($('.st-menu-open').is(':visible')) {
        $('#contener').children('.notif').remove();
    }
}
// Lors de l'ouverture du chat, on supprime aussi la notif
$('#contener').click(function () {
    $('#contener').children('.notif').remove();
});

// Ajoute un message interne dans la page
function insereMyMessage(pseudo, message) {
    $('#list_chat').prepend('<li class="block-envoye"> <div class="pseudo-envoye">' + pseudo + '</div> <div class="message-envoye">' + message + '</div></li>');
}

// Quand un client se déconnecte, on affiche l'information
socket.on('disconnect', function (pseudo) {
    $('#list_chat').prepend('<li><em>' + pseudo + ' a quitt&eacute; la conversation !</em></li>');
    //$('#list_parts>li').remove( ":contains('" + pseudo +"')" );
})
//////////////////////
$('#invitation').click(function () {
    var dest = prompt('Entrez le mail du destinataire');
    var url = 'http://' + location.hostname + ':3000/room/main';
    socket.emit('invitation', {pseudo: pseudo, destinataire: dest, url: url});
});

// start Drag n Drop
$('#draggableBtn').click(function () {
    $('#participants').children('video').addClass('draggable');
    var element = document.querySelectorAll('.draggable');

    var i;
    for (i = 0; i < element.length; i++) {

        element[i].style.cursor = "move";

        var draggie = new Draggabilly(element[i]);

        function onDragMove(instance, event, pointer) {
            console.log('dragMove on ' + event.type +
                    pointer.pageX + ', ' + pointer.pageY +
                    ' position at ' + instance.position.x + ', ' + instance.position.y);
        }
        // bind event listener
        draggie.on('dragMove', onDragMove);
        // un-bind event listener
        draggie.off('dragMove', onDragMove);
        // return true to trigger an event listener just once
        draggie.once('dragMove', function () {
            console.log('Draggabilly did move, just once');
        });
    }
});
// end Drag n Drop
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }

}