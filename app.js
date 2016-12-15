var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function( req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'))

serv.listen(2000);
console.log("Server started :3");

var SOCKET_LIST = {};
var Player = require('./server/Player.js');
var Bullet = require('./server/Bullet.js');


var playerList = {};
var bulletList = {};

Player.update = function(){
  var pack = [];
  for(var i in playerList){
    var player = playerList[i];
    player.update();
    pack.push({
      x:player.x,
      y:player.y,
      number:player.number
    });
  }
  return pack;
}

Bullet.update = function(){
  var pack = [];
  for(var i in bulletList){
    var bullet = bulletList[i];
    bullet.update();
    if(bullet.toRemove){
      delete bulletList[i];
    }else{
      pack.push({
        x:bullet.x,
        y:bullet.y,
      });
    }
  }
  return pack;
}

var io = require('socket.io')(serv,{});
var debug = true;

io.sockets.on('connection', function(socket){
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;

  var player = Player(socket.id, playerList, bulletList);
  player.onConnect(socket);

  socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
    delete playerList[socket.id];
  });

  socket.on('sendMsgToServer',function(data){
    var playerName = ("" + socket.id).slice(2,7);
    for(var i in SOCKET_LIST){
      SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data);
    }
  });
  socket.on('evalServer',function(data){
    if(!debug)
      return;
    var res = eval(data);
    socket.emit('evalAnswer',res);
  });
});

setInterval(function(){
  var pack = {
    player: Player.update(),
    bullet: Bullet.update(),
  }

  for(var i in SOCKET_LIST){
    var socket =  SOCKET_LIST[i];
    socket.emit('newPosition', pack);
  }
},1000/25);
