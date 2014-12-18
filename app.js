var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3003;
var ceaser = require('./crypto/ceaser');
var playfair = require('./crypto/playfair');
var alphabet = "abcdefghijklmnopqrstuvwxyz";
var ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

//var passport = require('passport');
//var LocalStrategy = require('passport-local').Strategy;

app.use(express.static(__dirname + '/public'));
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('chatSecret'));
app.use(express.session());


server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
    var addedUser = false;

    socket.on('new message', function (data) {
        console.log('---- New Message ----:');
        console.log('user:', socket.username);
        console.log('message:', data)
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data,
            time: new Date().getTime()
        });
    });

    socket.on('add user', function (data) {
        console.log('---- New User ----:');
        console.log(data)
        var username = data.username;
        var crypto = data.crypto || 'Ceaser';

        socket.username = username;
        socket.crypto = crypto;
        usernames[username] = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers,
            usernames: usernames
        });

        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    socket.on('typing', function () {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    socket.on('stop typing', function () {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    socket.on('disconnect', function () {
        if (addedUser) {
            delete usernames[socket.username];
            --numUsers;

            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});
