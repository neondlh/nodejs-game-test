var mongojs = require("mongojs");
var db = mongojs('localhost:27017/myGame', ['account','progress']);

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function( req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'))

serv.listen(2000);
console.log("Server started :3");

var io = require('socket.io')(serv,{});
var debug = true;

var SOCKET_LIST = {};
var Player = require('./server/player.js');
var Bullet = require('./server/bullet.js');

var playerList = {};
var bulletList = {};

var initPack = {player:[], bullet:[]};
var removePack = {player:[], bullet:[]};

Player.update = function(){
  var pack = [];
  for(var i in playerList){
    var player = playerList[i];
    player.update();
    pack.push({
      id:player.id,
      x:player.x,
      y:player.y,
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
      removePack.bullet.push(bullet.id);
    }else{
      pack.push({
        id:bullet.id,
        x:bullet.x,
        y:bullet.y,
      });
    }
  }
  return pack;
}


//db
var isValidPassword = function(data,cb){
  db.account.find({username:data.username, password:data.password}, function(err, res){
    if(res.length > 0)
      cb(true);
    else {
      cb(false);
    }
  });
}
var isUsernameTaken = function(data,cb){
  db.account.find({username:data.username}, function(err, res){
    if(res.length > 0)
      cb(true);
    else {
      cb(false);
    }
  });
}
var addUser = function(data,cb){
  db.account.insert({username: data.username, password: data.password}, function(err, res){
    cb();
  });
}

io.sockets.on('connection', function(socket){
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;

  socket.on('signIn',function(data){
    isValidPassword(data,function(res){
      if(res){
        var player = Player(socket.id, playerList, bulletList, initPack);
        player.onConnect(socket);
        socket.emit('signInResponse',{success:true});
      } else {
        socket.emit('signInResponse',{success:false});
      }
    });
  });

  socket.on('signUp',function(data){
    isUsernameTaken(data,function(res){
      if(res){
        socket.emit('signUpResponse',{success:false});
      } else {
        addUser(data,function(){
          socket.emit('signUpResponse',{success:true});
        });
      }
    });
  });

  socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
    delete playerList[socket.id];
    removePack.player.push(socket.id);
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
		player:Player.update(),
		bullet:Bullet.update(),
	}

	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('init',initPack);
		socket.emit('update',pack);
		socket.emit('remove',removePack);
	}
	initPack.player = [];
	initPack.bullet = [];
	removePack.player = [];
	removePack.bullet = [];
},1000/25);
