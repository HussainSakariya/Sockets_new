const { Socket } = require('dgram');
var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoclient = require('mongodb');
var url = "mongodb://localhost:27017/chatapp";

var users = [];


session = require("express-session")({
   secret: "my-secret",
   resave: true,
   saveUninitialized: true
}),
   sharedsession = require("express-socket.io-session");


// Attach session
app.use(session);

// Share session with io sockets

io.use(sharedsession(session));


app.use(express.static(__dirname + '/public'))

app.get('/', function (req, res) {
   res.sendfile('index.html');
});

app.get('/index.html', function (req, res) {
   res.sendfile('index.html');
});

app.get('/msgbox.html', function (req, res) {
   res.sendfile('msgbox.html');
});

app.get('/register.html', function (req, res) {
   res.sendfile('register.html');
});

app.get('/groupbox.html', function (req, res) {
   res.sendfile('groupbox.html');
});




io.on('connection', function (socket) {
   console.log('A user connected');

   socket.on('chackUsername', function (data) {
      mongoclient.connect(url, function (err, db) {
         if (err) throw err;
         var dbo = db.db("chatapp");
         dbo.collection('users').find({ username: data }, { $exists: true }).toArray(function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
               socket.emit('userNotExists', ' username is Not Exist!');
            } else {
               socket.handshake.session.username = data;
               socket.handshake.session.save();
               socket.emit('userSet');
            }
            db.close();
         });
      });
   });

   socket.on('setUsername', function (data) {
      mongoclient.connect(url, function (err, db) {
         if (err) throw err;
         var dbo = db.db("chatapp");
         dbo.collection('users').find({ username: data }, { $exists: true }).toArray(function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
               var rec = { username: data };
               dbo.collection("users").insertOne(rec, function (err, res) {
                  if (err) throw err;
                  console.log("1 document inserted");
                  db.close();
                  socket.emit('userNotExists', 'Registerd');
               });
            } else {
               socket.emit('userExists', data + ' username is taken! Try some other username.');
            }
            db.close();
         });
      });
   });

   socket.on('getUsers', function (data) {
      mongoclient.connect(url, function (err, db) {
         if (err) throw err;
         var dbo = db.db("chatapp");
         dbo.collection('users').find().toArray(function (err, result) {
            if (err) throw err;
            socket.emit('setUsers', { 'users': result, 'user': socket.handshake.session.username });
            db.close();
         });
      });
   });

   socket.on('setGroup', function (data) {
      mongoclient.connect(url, function (err, db) {
         if (err) throw err;
         var dbo = db.db("chatapp");
         dbo.collection('msggrp').find({ touser: data.touser, fromuser: data.fromuser }, { $exists: true }).toArray(function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
               dbo.collection('msggrp').find({ touser: data.fromuser, fromuser: data.touser }, { $exists: true }).toArray(function (err, result) {
                  if (err) throw err;
                  // socket.emit('setUsers',{'users':result,'user': socket.handshake.session.username});
                  if (result.length == 0) {
                     rec = { touser: data.touser, fromuser: data.fromuser }
                     dbo.collection("msggrp").insertOne(rec, function (err, res) {
                        if (err) throw err;
                        console.log("1 msg group inserted");
                        socket.emit('opengroupbox')
                        db.close();
                     });
                  } else {
                     socket.emit('opengroupbox')
                  }
               });
            } else {
               socket.emit('opengroupbox')
            }
         });
      });
   });


   socket.on('addmsg', function (data) {
      // console.log(data.msg, data.touser, data.fromuser,data.dt)
      mongoclient.connect(url, function (err, db) {

         if (err) throw err;
         var dbo = db.db("chatapp");
         dbo.collection('msggrp').find({ touser: data.touser, fromuser: data.fromuser }, { $exists: true }).toArray(function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
               dbo.collection('msggrp').find({ touser: data.fromuser, fromuser: data.touser }, { $exists: true }).toArray(function (err, result) {
                  if (err) throw err;
                  rec = { grpid: result[0]['_id'], msg: data.msg, date: data.dt }
                  dbo.collection("messages").insertOne(rec, function (err, res) {
                     if (err) throw err;
                     console.log("1 msg inserted");
                     
                     getallmsg(result[0]['_id']);
                  });
               });
            } else {
               rec = { grpid: result[0]['_id'], msg: data.msg, date: data.dt }
               dbo.collection("messages").insertOne(rec, function (err, res) {
                  if (err) throw err;
                  console.log("1 msg inserted");
                  
                  getallmsg(result[0]['_id']);
               });
            }
         });
      });
   });

   function getallmsg(id) {
      console.log(id);
      mongoclient.connect(url, function (err, db) {
         if (err) throw err;
         var dbo = db.db("chatapp");
         dbo.collection('messages').find({ grpid: id }).toArray(function (err, result) {
            if (err) throw err;
            Socket.emit('showmsg', result)
            db.close();
         });
      });
   }

});

http.listen(4000, function () {
   console.log('listening on localhost:3000');
});

