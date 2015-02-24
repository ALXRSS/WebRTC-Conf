var Dropzone = require("dropzone");

var socket = io.connect();

// On affiche le dossier partag� � tous les participants
socket.on('afficherFolder', function (data) {
    $("#tree").html(data);
    $('#files').tree({
        expanded: 'li:first'
    });
});

function downloadFile(file) {
    $.get('/download', file);
}

// Affichage de la zone de D&D
$(function () {


    var prw = '<div id="preview-template">Hello</div>';

    Dropzone.options.myAwesomeDropzone = {
        maxFilesize: 10,
        // createImageThumbnails: false,
        previewsTemplate: prw,
        previewsContainer: previewZone,
        init: function () {
            this.on("error", function (file) {
                alert("Error during the upload, pleasy try again");
            });
        }
    };

});


// Appel au serveur pour r�cuperer le descripteur du dossier partag�
function loadFolder() {
    var socket = io.connect();
    socket.emit('getFolder');
}

loadFolder();