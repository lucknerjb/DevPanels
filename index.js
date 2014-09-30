var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var config = require('./config/config.json');
var _ = require('underscore');
Tail = require('tail').Tail;

var _sockets = {};

// Views
var base_path = path.join(__dirname , '');
app.set('views', base_path + '/public/views');
app.set('view engine', 'jade');
app.use(express.static(base_path + '/public'));

app.get('/', function(req, res){
  res.sendFile(base_path + '/client/index.html');
});

app.get('/api/streams', function(req, res) {
   var streams = config.streams;

   // Delete keys that are internal
   _.each(streams, function(stream) {
      delete stream.path;
      delete stream.custom;
   });

   res.json(streams);
});

app.get('*', function(req, res) {
   // console.log(req);
});

io.on('connection', function(socket){
   socket.on('identify', function(data) {
      // Store the socket
      _sockets[data.identifier] = socket;

      // Return a success message
      socket.emit('identified', {status: 'success', identifier: data.identifier});
   });

   socket.on('disconnect', function(data) {
      if (typeof _sockets[data.identifier] !== 'undefined') {
         _sockets[data.identifier].disconnect();
      }
   });

   socket.on('connect_stream', function(sockdata) {
      console.log(sockdata);
      tail = new Tail("/var/log/nginx/error.log");
      var identifier = sockdata.identifier;

      tail.on("line", function(data) {
        console.log(data);
        _sockets[identifier].emit('stream_data', {line: data, identifier: identifier, stream: sockdata.stream});
      });

      tail.on("error", function(error) {
        console.log('ERROR: ', error);
      });
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
