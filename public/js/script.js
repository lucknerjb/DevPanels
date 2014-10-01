var socket;
var identifier;
var _sockets = {};
// var socketServer = '127.0.0';
var streams = {};
var current_stream_id;
var stream_indices = {};

function generateIdentifier() {
   var text = "";
   var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

   for( var i=0; i < 10; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
   }

   return text;
}

function startSocket() {
   socket = io();
   $('#toolbar').css('background', '#65A33F');
}

function pad(n) {
    return ("0" + n).slice(-2);
}

function initSocket() {
   // Create an identifier
   identifier = generateIdentifier();

   // Create a socket server
   startSocket();

   // Identify socket
   socket.emit('identify', {identifier: identifier});
   socket.on('identified', function(data) {
      $('#socketStatus').html('Connected as [' + data.identifier + ']');
   });

   // Listen to data streams
   socket.on('stream.data', function(data) {
      console.log(data);
      var host = 'localhost';
      var now = new Date();
      var hh = pad(now.getHours());
      var mm = pad(now.getMinutes());
      var ss = pad(now.getSeconds());

      var timeMark = '[' + hh + ':' + mm + ':' + ss + '] ';

      var line = "<table class='message'><tr><td width='1%' class='date'>" + timeMark + "</td><td width='1%' valign='top' class='host'><a href=?ip=" + host + ">" + host + "</a></td>";
      line += "<td class='msg-text' width='98%'>" + data.line + "</td></tr>";
      $('#stream-' + data.stream_id + ' .log').append(line);
      // updateCount();

      // Auto scroll to bottom
      window.scrollTo(0,document.body.scrollHeight);
   });
}

function disconnectSocket() {
   socket.emit('disconnect', {identifier: identifier});
   $('#socketStatus').html('Disconnected');
   $('#toolbar').css('background', '#933');
}

/*
function identify(identifier, stream_id) {
   _sockets[stream_id].emit('identify', {identifier: identifier, stream: stream_id});
   _sockets[stream_id].on('identified', function(data) {
      $('#socketStatus').html('Connected as [' + data.identifier + ']');
   });
}

function connectToStream(stream_id) {
   // Get an identifier
   var identifier = generateIdentifier();

   // Get a socket and store it
   var socket = startSocket();
   _sockets[stream_id] = socket;

   // Identify
   identify(identifier, stream_id);

   socket.emit('connect_stream.' + stream_id, {stream: stream_id, identifier: identifier});
   socket.on('stream_data' + stream_id, function(data) {
      console.log(data);
      var host = 'localhost';
      var now = new Date();
      var hh = pad(now.getHours());
      var mm = pad(now.getMinutes());
      var ss = pad(now.getSeconds());

      var timeMark = '[' + hh + ':' + mm + ':' + ss + '] ';

      var line = "<table class='message'><tr><td width='1%' class='date'>" + timeMark + "</td><td width='1%' valign='top' class='host'><a href=?ip=" + host + ">" + host + "</a></td>";
      line += "<td class='msg-text' width='98%'>" + data.line + "</td></tr>";
      $('#stream-' + data.stream + ' .log').append(line);
      console.log('#stream-' + data.stream + ' .log');
      // updateCount();
   });
}
*/

function displayStreams(streams) {
   _.each(streams, function(stream, index) {
      console.log(stream);
      elem = '<a href="" class="btn btn-primary connect-stream" data-stream="' + stream.id + '"><span class="badge pull-right">0</span>' + stream.name + '&nbsp;</a>';
      $('#connected-streams').append(elem);
   });
}

function toggleStream(stream_id) {
   // Hide all streams and display this one
   $('.stream').hide();

   // Do we have this view?
   if ($('#stream-' + stream_id).length == 0) {
      createStreamView(stream_id);
      // fetchInitialData(stream.id);
   }

   $('#stream-' + stream_id).show();

   current_stream_id = stream_id;
}

function toggleStreamsContainer() {
   $('#connected-streams').slideToggle('slow');
}

function createStreamView(stream_id) {
   var html = ' \
   <div id="stream-' + stream_id + '" class="stream"> \
      <div class="table-responsive log"></div> \
   </div>';

   $('#streams').append(html);
}

function listenToStream(stream_id) {
   socket.emit('stream.listen', {identifier: identifier, stream_id: stream_id});

   createStreamView(stream_id);
}

function calculateStreamIndices() {
   var index = 0;
   _.each(streams, function(stream, stream_id) {
      stream_indices[stream_id] = index;
      index++;
   });
}

$(document).ready(function() {
   // Get Streams
   $.ajax({
      url: '/api/streams',
      type: 'GET',
      success: function(data) {
         all_streams = data;
         displayStreams(data);
         initSocket();
      },
      error: function(data) {
         alert('Could not fetch streams');
      }
   });

   $('#toggle-streams').click(function(e) {
      e.preventDefault();
      $('#connected-streams').slideToggle('slow');
   });

   // $(document).on('click', '.connect', function(e) {
   //    e.preventDefault();
   //    startSocket();
   //    identify();
   //    $(this).removeClass('connect').addClass('disconnect').html('Disconnect');
   // });

   // $(document).on('click', '.disconnect', function(e) {
   //    e.preventDefault();
   //    disconnectSocket();
   //    $(this).removeClass('disconnect').addClass('connect').html('Connect');
   // });

   $(document).on('click', '.connect-stream', function(e) {
      e.preventDefault();
      var self = $(this);
      var stream_id = self.data('stream');

      // If we are not listening to the stream, let's do so
      if ('undefined' == typeof streams[stream_id]) {
         self.removeClass('btn-primary').addClass('btn-success');

         // Add to active streams
         var stream = all_streams[stream_id];
         streams[stream_id] = stream.name;
         var html = '<li><a href="#" class="switch-stream" data-name="' + stream.name + '" data-stream="' + stream.id + '">' + stream.name + '</a></li>';
         $('#active-streams').append(html);

         // Listen
         listenToStream(stream_id);

         // Last picked stream becomes the active one
         toggleStream(stream_id);
         $('#current-stream').html(stream.name);
      }
      // Remove the stream from the list of streams we listen for
      else {
         var index = streams.indexOf(stream_id);
         streams.splice(index, 1);
         self.removeClass('btn-success').addClass('btn-primary');

         $('#active-streams').find('a[data-stream="' + stream_id + '"]').remove();

         // muteStream(stream_id);
      }

      calculateStreamIndices();
   });

   $(document).on('click', '.switch-stream', function(e) {
      e.preventDefault();
      var stream_id = $(this).data('stream');
      toggleStream(stream_id);
      $('#current-stream').html($(this).html());
   });

   // Key binding for Left and Right arrow keys
   $(document).keydown(function(e) {
      // Left Arrow
      if(e.ctrlKey && e.which == 37) {
         var max_index = Object.keys(streams).length - 1;
         var is_last = (current_stream_id === Object.keys(streams)[max_index]);

         // If this is the first stream in the list, show the last one
         var next = current_stream_id;
         if (stream_indices[current_stream_id] === 0) {
            next = Object.keys(streams)[max_index];
         } else {
            next = Object.keys(streams)[stream_indices[current_stream_id] - 1];
         }
      }
      // Right Arrow
      else if(e.ctrlKey && e.which == 39) {
         var max_index = Object.keys(streams).length - 1;
         var is_last = (current_stream_id === Object.keys(streams)[max_index]);

         // If this is the last stream in the list, show the first one
         var next = current_stream_id;
         if (stream_indices[current_stream_id] === max_index) {
            next = Object.keys(streams)[0];
         } else {
            next = Object.keys(streams)[stream_indices[current_stream_id] + 1];
         }

         // Show the view and change the toolbar
         toggleStream(next);
         $('#current-stream').html(streams[next]);
      }
   });
});
