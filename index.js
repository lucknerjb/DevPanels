var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var config = require('./config/config.json');
var _ = require('underscore');
Tail = require('tail').Tail;

// Vars
var tails = {};
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

   // @TODO
   // Delete keys that are internal
   // var streams = _.clone(config.streams);
   // _.each(streams, function(stream) {
   //    delete stream.path;
   //    delete stream.custom;
   // });

   res.json(streams);
});

app.get('*', function(req, res) {
   // console.log(req);
});

io.on('connection', function(socket){
   // buildSocketEvents(socket);

   socket.on('identify', function(data) {
      // Store the socket
      _sockets[data.identifier] = socket;

      // Return a success message
      socket.emit('identified', {status: 'success', identifier: data.identifier});
   });

   socket.on('stream.listen', function(data) {
      tailStream(data.identifier, data.stream_id);
   });

   socket.on('disconnect', function(data) {
      if (typeof _sockets[data.identifier] !== 'undefined') {
         _sockets[data.identifier].disconnect();
      }
   });

  //  socket.on('connect_stream', function(sockdata) {
  //     var identifier = sockdata.identifier;
  //     var stream = sockdata.stream;

  //     var file = getStreamPath(sockdata.stream);
  //     tails[stream] = new Tail(file);

  //     tails[stream].on("line", function(data) {
  //        console.log('got line');
  //       _sockets[stream].emit('stream_data', {line: data, identifier: identifier, stream: stream});
  //     });

  //     tails[stream].on("error", function(error) {
  //       console.log('ERROR: ', error);
  //     });
  // });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function tailStream(identifier, stream_id) {
   var streams = config.streams;
   var file_path = getStreamPath(stream_id);

   // Create a new Tail object and listen for file changes
   tails[stream_id] = new Tail(file_path);
   tails[stream_id].on("line", function(data) {
      console.log('got line');
     io.to(_sockets[identifier].id).emit('stream.data', {line: data, stream_id: stream_id});
   });

   tails[stream_id].on("error", function(error) {
     console.log('ERROR: ', error);
   });
}

function getStreamPath(stream_id) {
   var streams = config.streams;
   return streams[stream_id].path;
}
