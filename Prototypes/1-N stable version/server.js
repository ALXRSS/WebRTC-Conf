// Source Code - https://github.com/muaz-khan/WebRTC-Scalable-Broadcast

var path = require("path");
var fs = require("fs");
var nodemailer = require('nodemailer');
var ent = require('ent');


var app = require('http').createServer(function (request, response) {
    var uri = require('url').parse(request.url).pathname,
        filename = path.join(process.cwd(), uri);

    path.exists(filename, function (exists) {
        if (!exists) {
            response.writeHead(404, {
                "Content-Type": "text/plain"
            });
            response.write('404 Not Found: ' + filename + '\n');
            response.end();
            return;
        }

        if (fs.statSync(filename).isDirectory()) filename += '/site/index.html';

        fs.readFile(filename, 'binary', function (err, file) {
            if (err) {
                response.writeHead(500, {
                    "Content-Type": "text/plain"
                });
                response.write(err + "\n");
                response.end();
                return;
            }

            response.writeHead(200);
            response.write(file, 'binary');
            response.end();
        });
    });
});

// var server = require('http').Server(app);
// var io = require('socket.io').listen(server);

// /////////////////// Notre ancien code

// // Liste des participants
// var participants = [];

// // create reusable transporter object using SMTP transport
// var transporter = nodemailer.createTransport({
//     service: 'Gmail',
//     auth: {
//         user: 'webrtcevry@gmail.com',
//         pass: 'webrtcevry91'
//     }
// });

// // on utilise socket.io pour créer deux variables de session à transférer aux clients
// io.sockets.on('connection', function (socket, pseudo) {
  
//     // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
//     socket.on('nouveau_client', function(pseudo) {
//         pseudo = ent.encode(pseudo);
//         socket.set('pseudo', pseudo);
//         socket.broadcast.emit('nouveau_client', pseudo);
//         //Ajout du nouveau participant a la liste
//         participants.push(pseudo);
//         // On donne la liste des participants (événement créé du côté client)
//         socket.emit('recupererParticipants', participants);
//         fs.stat(__dirname + "/data/mainRoom.txt", function(err, stat) {
//             if(err){
//                 fs.writeFile(__dirname + "/data/mainRoom.txt", "");
//             }
//             else {
//                 var text = fs.readFileSync(__dirname + "/data/mainRoom.txt", "UTF-8");
//                 var lines = text.split('\n');
                
//                 //for(var i = lines.length - 2; i >= 0; --i) {
//                 // lines.length - 1, because we begin with a file with an empty line
//                 for(var i = 0; i < lines.length - 1; ++i) {
//                     console.log(lines.length);
//                     var a = lines[i].search(" : ");
//                     var pseudoLine = lines[i].substring(0,a);
//                     var messageLine = lines[i].substring(a+3,lines[i].length);
//                     socket.emit('message', {pseudo: pseudoLine, message: messageLine});
//                 }
//             }
//         });
//     });

//     // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
//     socket.on('message', function (message) {
//         socket.get('pseudo', function (error, pseudo) {
//             message = ent.encode(message);
//             socket.broadcast.emit('message', {pseudo: pseudo, message: message});
//             // append at the beginning of the file the log of the chat
//             fs.appendFile(__dirname + "/data/mainRoom.txt", pseudo + " : " + message + "\n", function(err) {
//                 if(err) throw err;
//                 console.log("The file was saved!");
//             });
//         });
//     });
  
//   // Vider l'objet à la déconnexion
//   socket.on('disconnect', function () {
//     socket.get('pseudo', function (error, pseudo) {
//       socket.broadcast.emit('disconnect', pseudo);
//       // mettre à jour la liste des participants et la renvoyer aux autres clients
//       var index = participants.indexOf(pseudo);
//       participants.splice(index, 1);
//       socket.broadcast.emit('recupererParticipants', participants);
//     });
//   });

//   ///////////////////
//     socket.on('invitation', function (data) {

//       // setup e-mail data with unicode symbols
//       var mailOptions = {
//         from: 'Web RTC <webrtcevry@gmail.com>', // sender address
//         to: data.destinataire, // list of receivers
//         subject: 'Invitation WebRTC', // Subject line
//         text: 'Bonjour, '+ data.pseudo +' vous invite à rejoindre une room web RTC à cette adresse : '+ data.url, // plaintext body
//         html: '<b>Bonjour, '+ data.pseudo +' vous invite à rejoindre une room web RTC à cette adresse : '+ data.url +'</b>' // html body
//       };

//         // send mail with defined transport object
//         transporter.sendMail(mailOptions, function(error, info){
//           if(error){
//            console.log(error);
//           }else{
//            console.log('Message sent: ' + info.response);
//           }
//         });
//     });

//     /////////////////
  
// });





////////////////////

// Lancement du server
app.listen(8888);

require('./WebRTC-Scalable-Broadcast.js')(app);