var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express();
var multer = require('multer');
var server = require('http').Server(app);
var browserify = require('browserify-middleware');
var serverPort = parseInt(process.env.PORT, 10) || 3000;
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var ent = require('ent');
var nodemailer = require('nodemailer');
var chokidar = require('chokidar');
var done = false;
var sharedFolder = "./shared";

// Liste des participants
var participants = [];

// create the switchboard
var switchboard = require('rtc-switchboard')(server);

app.get('/', function (req, res) {
    res.redirect(req.uri.pathname + 'room/main/');
});

browserify.settings.development('debug', true);

// force development mode for browserify given this is a demo
browserify.settings('mode', 'development');

// serve the rest statically
app.use(browserify('./site'));
app.use(express.static(__dirname + '/site'));

// we need to expose the primus library
app.get('/rtc.io/primus.js', switchboard.library());
app.get('/room/:roomname', function (req, res, next) {
    res.writeHead(200);
    fs.createReadStream(path.resolve(__dirname, 'site', 'room.html')).pipe(res);
});

////////////////////////////
// create reusable transporter objec  t using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'webrtcevry@gmail.com',
        pass: 'webrtcevry91'
    }
});

///////////////////////////////////

// on utilise socket.io pour créer deux variables de session à transférer aux clients
io.sockets.on('connection', function (socket, pseudo) {

    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    socket.on('nouveau_client', function (pseudo) {
        pseudo = ent.encode(pseudo);
        socket.set('pseudo', pseudo);
        socket.broadcast.emit('nouveau_client', pseudo);
        //Broadcast du dossier partagé
        //console.log(getFolderDescription());
        //socket.broadcast.emit('afficherFolder', getFolderDescription());
        //Ajout du nouveau participant a la liste
        participants.push(pseudo);
        // On donne la liste des participants (événement créé du côté client)
        socket.emit('recupererParticipants', participants);
        fs.stat(__dirname + "/data/mainRoom.txt", function (err, stat) {
            if (err) {
                fs.writeFile(__dirname + "/data/mainRoom.txt", "");
            }
            else {
                var text = fs.readFileSync(__dirname + "/data/mainRoom.txt", "UTF-8");
                var lines = text.split('\n');

                //for(var i = lines.length - 2; i >= 0; --i) {
                // lines.length - 1, because we begin with a file with an empty line
                for (var i = 0; i < lines.length - 1; ++i) {
                    console.log(lines.length);
                    var a = lines[i].search(" : ");
                    var pseudoLine = lines[i].substring(0, a);
                    var messageLine = lines[i].substring(a + 3, lines[i].length);
                    socket.emit('message', {pseudo: pseudoLine, message: messageLine});
                }
            }
        });
    });

    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
    socket.on('message', function (message) {
        socket.get('pseudo', function (error, pseudo) {
            message = ent.encode(message);
            socket.broadcast.emit('message', {pseudo: pseudo, message: message});
            // append at the beginning of the file the log of the chat
            fs.appendFile(__dirname + "/data/mainRoom.txt", pseudo + " : " + message + "\n", function (err) {
                if (err)
                    throw err;
                console.log("The file was saved!");
            });
        });
    });

    socket.on('getFolder', function () {
        socket.emit('afficherFolder', getFolderDescription());
    });

/////////////// https://github.com/paulmillr/chokidar ////////////
    require('chokidar').watch(sharedFolder, {ignored: /[\/\\]\./}).on('all', function (event, path) {
        // if (event === 'add' || event === 'unlink') {
        socket.emit('afficherFolder', getFolderDescription());
        // }
    });

    // Vider l'objet à la déconnexion
    socket.on('disconnect', function () {
        socket.get('pseudo', function (error, pseudo) {
            socket.broadcast.emit('disconnect', pseudo);
            // mettre à jour la liste des participants et la renvoyer aux autres clients
            var index = participants.indexOf(pseudo);
            participants.splice(index, 1);
            socket.broadcast.emit('recupererParticipants', participants);
        });
    });

    ///////////////////
    socket.on('invitation', function (data) {

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: 'Web RTC <webrtcevry@gmail.com>', // sender address
            to: data.destinataire, // list of receivers
            subject: 'Invitation WebRTC', // Subject line
            text: 'Bonjour, ' + data.pseudo + ' vous invite à rejoindre une room web RTC à cette adresse : ' + data.url, // plaintext body
            html: '<b>Bonjour, ' + data.pseudo + ' vous invite à rejoindre une room web RTC à cette adresse : ' + data.url + '</b>' // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Message sent: ' + info.response);
            }
        });
    });

    /////////////////


});

///////////////// SHARED FOLDER /////////////////
function getFolderDescription() {

    var folder = "<ul id='files'><li><a href='#shared'>Shared folder</a><ul>";
    var files = fs.readdirSync(sharedFolder);
    files.forEach(function (entry) {
        // folder += "<li><a id='" + entry + "' onclick='downloadFile(this.id)' href='#'>" + entry + "</a></li>";
        folder += "<li><a id='" + entry + "' href='/download/" + entry + "'>" + entry + "</a></li>";
    });
    folder += "</ul></li></ul>";
    return folder;
}

app.get('/download/:fileName', function (req, res) {
    var file = sharedFolder + '/' + req.params.fileName;
    res.download(file, function (err) {
        if (err) {
            console.log("error occured");
        } else {
            console.log("ok!");
        }
    });

});

/*Configure the multer.*/

app.use(multer({dest: './shared/',
    rename: function (fieldname, filename) {
        return filename + Date.now();
    },
    onFileUploadStart: function (file) {
        console.log(file.originalname + ' is starting ...')
    },
    onFileUploadComplete: function (file) {
        console.log(file.fieldname + ' uploaded to  ' + file.path);
        done = true;
    }
}));

/*Handling routes.*/

app.get('/', function (req, res) {
    res.sendfile("index.html");
});

app.post('/upload', function (req, res) {
    if (done === true) {
        // console.log(req.files);
        res.end("File uploaded.");
    }
});
///////////////// END SHARED FOLDER /////////////////

// start the server
server.listen(serverPort, function (err) {
    if (err) {
        return console.log('Encountered error starting server: ', err);
    }

    console.log('running @ http://localhost:' + serverPort + '/');
});