var lat;
var lon;
var socket = io.connect();
var maCarte;
var marqueurs = [];
var utilisateurs = [];
var myMarkerImage = new google.maps.MarkerImage('../../img/users.png');

// Lancement de la map au démarrage, suite à un bug entre jquery
$(document).ready(function () {
    $("#popMap").click(function () {
        $("#mapcanvas").dialog({title: "Localisation participants", height: 500, width: 500, modal: true});
        google.maps.event.trigger(maCarte, 'resize');
    });
    $("#mapcanvas").dialog({title: "Localisation participants", height: 500, width: 500, modal: true});

    $("#mapcanvas").dialog('close');
});

// Supprime les utilisateurs déconnecté sur la map 
socket.on('supprimerPosition', function (pseudo) {
    var pos = null;
    for (var i = 0; i < marqueurs.length; i++) {
        if (utilisateurs[i] == pseudo) {
            pos = i;
        }
    }
    if (pos) {

        marqueurs[pos].setMap(null);
        marqueurs.splice(pos, 1);
        utilisateurs.splice(pos, 1);

        for (var i = 0; i < postab.length; i++) {
            var marqueur = new google.maps.Marker({
                position: new google.maps.LatLng(postab[i].lat, postab[i].lon),
                map: maCarte,
                icon: myMarkerImage,
                title: postab[i].pseudo
            });


            if ((marqueurs[i] == null) && (utilisateurs[i] == null)) {
                marqueurs.push(marqueur);
                utilisateurs.push(postab[i].pseudo);
            }
        }
    }
    google.maps.event.trigger(maCarte, 'resize');
});

//Méthode executer pour rafraichir les clients en cas de nouveaux clients ou de clients qui se deconnectent
socket.on('recupererPosition', function (postab) {
    for (var i = 0; i < postab.length; i++) {
        var marqueur = new google.maps.Marker({
            position: new google.maps.LatLng(postab[i].lat, postab[i].lon),
            map: maCarte,
            icon: myMarkerImage,
            title: postab[i].pseudo
        });


        if ((marqueurs[i] == null) && (utilisateurs[i] == null)) {
            marqueurs.push(marqueur);
            utilisateurs.push(postab[i].pseudo);
            google.maps.event.addListener(marqueurs[i], 'click', function () {
                maCarte.panTo(this.getPosition());
                maCarte.setZoom(9);
            }); 

        }
    }
    google.maps.event.trigger(maCarte, 'resize');
});

// Initialisation de la map
function initialisation() {
    var centreCarte = new google.maps.LatLng(59.085739, -17.29248);
    var optionsCarte = {
        zoom: 4,
        center: centreCarte
    }
    maCarte = new google.maps.Map(document.getElementById("carte"), optionsCarte);
}
google.maps.event.addDomListener(window, 'load', initialisation)







