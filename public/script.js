var socket;
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

function identify() {
   var identifier = generateIdentifier();
   socket.emit('identify', {identifier: identifier});
   socket.on('identified', function(data) {
      $('#socketStatus').html('Connected as [' + data.identifier + ']');
   });
}

function connectToStream(stream) {
   socket.emit('connect_stream', {stream: 'error-log', user: 'jeanbal'});
   socket.on('stream_data', function(data) {
      var host = 'localhost';
      var now = new Date();
      var hh = pad(now.getHours());
      var mm = pad(now.getMinutes());
      var ss = pad(now.getSeconds());

      var timeMark = '[' + hh + ':' + mm + ':' + ss + '] ';

      var line = "<table class='message'><tr><td width='1%' class='date'>" + timeMark + "</td><td width='1%' valign='top' class='host'><a href=?ip=" + host + ">" + host + "</a></td>";
      line += "<td class='msg-text' width='98%'>" + data.line + "</td></tr>";
      $('#log').append(line);
      // updateCount();
   });
}

$(document).ready(function() {
   // startSocket();
   // identify();

   $('#toggle-streams').click(function(e) {
      e.preventDefault();
      $('#connected-streams').show('slow');
   });
});
