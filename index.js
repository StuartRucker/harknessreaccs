// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;
var ratings  = {}
io.on('connection', function (socket) {
  var addedUser = false;
  var id = "";
  // when the client emits 'new message', this listens and executes
  socket.on("rating", function (data){
    ratings[data["id"]]  = data["rating"]
    id = data["id"];
    var count = 0;
    var sum = 0;
    for (var key in ratings) {
    // check if the property/key is defined in the object itself, not in parent
      if (ratings.hasOwnProperty(key)) {
          sum += ratings[key];
          count += 1;
        }
    }
    if(count == 0){
      count = 1;
      sum = .65;
    }

    socket.emit("averagerating", sum/count)
  });

  socket.on('new bubble', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new bubble',data);
  });

  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if(ratings.hasOwnProperty(id)){
      delete ratings[id]
    }
  });
});
