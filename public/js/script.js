var socket;
var identifier;
// var socketServer = '127.0.0';

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

function disconnectSocket() {
   socket.emit('disconnect', {identifier: identifier});
   $('#socketStatus').html('Disconnected');
   $('#toolbar').css('background', '#933');
}

function identify() {
   identifier = generateIdentifier();
   socket.emit('identify', {identifier: identifier});
   socket.on('identified', function(data) {
      $('#socketStatus').html('Connected as [' + data.identifier + ']');
   });
}

function connectToStream(stream_id) {
   socket.emit('connect_stream', {stream: stream_id, user: 'jeanbal', identifier: identifier});
   socket.on('stream_data', function(data) {
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

function displayStreams(streams) {
   _.each(streams, function(stream, index) {
      console.log(stream);
      elem = '<a href="" class="btn btn-primary connect-stream" data-stream="' + stream.id + '"><span class="badge pull-right">0</span>' + stream.name + '&nbsp;</a>';
      $('#connected-streams').append(elem);
   });
}

function toggleStream(stream) {
   // Hide all streams and display this one
   $('.stream').hide();

   // Do we have this view?
   if ($('#stream-' + stream).length == 0) {
      createStreamView(stream);
      // fetchInitialData(stream.id);
   }

   $('#stream-' + stream).show();
}

function toggleStreamsContainer() {
   $('#connected-streams').slideToggle('slow');
}

function createStreamView(stream) {
   var html = ' \
   <div id="stream-' + stream + '" class="stream"> \
      <div class="table-responsive log"></div> \
   </div>';

   $('#streams').append(html);
}

$(document).ready(function() {
   // Get Streams
   $.ajax({
      url: '/api/streams',
      type: 'GET',
      success: function(data) {
         displayStreams(data);
      },
      error: function(data) {
         alert('Could not fetch streams');
      }
   });

   $('#toggle-streams').click(function(e) {
      e.preventDefault();
      $('#connected-streams').slideToggle('slow');
   });

   $(document).on('click', '.connect', function(e) {
      e.preventDefault();
      startSocket();
      identify();
      $(this).removeClass('connect').addClass('disconnect').html('Disconnect');
   });

   $(document).on('click', '.disconnect', function(e) {
      e.preventDefault();
      disconnectSocket();
      $(this).removeClass('disconnect').addClass('connect').html('Connect');
   });

   $(document).on('click', '.connect-stream', function(e) {
      e.preventDefault();
      var self = $(this);
      var stream_id = self.data('stream');

      // Connected to a socket?
      if (!socket) {
         alert('Please connect first');
         return;
      }

      // Connected to stream?
      // @TODO: Move the classes to config
      var connected = self.hasClass('btn-success');

      if (!connected) {
         connectToStream(stream_id);
         self.removeClass('btn-primary').addClass('btn-success');
      }

      // Show the stream and hide the streams container
      toggleStream(stream_id);
      toggleStreamsContainer();
   });
});
