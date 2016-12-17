var Entity = require('./entity.js');
var Bullet = require('./bullet.js');

module.exports = function (id, playerList, bulletList, initPack){
  var self = Entity();
  self.id = id;
  self.number = "" + Math.floor(10 * Math.random());
  self.pressingRight = false;
  self.pressingLeft = false;
  self.pressingUp = false;
  self.pressingDown = false;
  self.pressingAttack = false;
  self.mouseAngle = 0;
  self.maxSpd = 10;
  self.playerList = playerList;
  self.bulletList = bulletList;
  self.initPack = initPack;

  var super_update = self.update;
  self.update = function(){
    self.updateSpd();
    super_update();
    if(self.pressingAttack){
      self.shootBullet(self.mouseAngle);
    }
  }

  self.shootBullet = function(angle){
    var b = Bullet(self.id, angle, playerList, bulletList, initPack);
    b.x = self.x;
    b.y = self.y;
  }

  self.updateSpd = function(){
    if(self.pressingRight)
      self.spdX = self.maxSpd;
    else if(self.pressingLeft)
      self.spdX = -self.maxSpd;
    else
      self.spdX = 0;

    if(self.pressingUp)
      self.spdY = -self.maxSpd;
    else if(self.pressingDown)
      self.spdY = self.maxSpd;
    else
      self.spdY = 0;
  }

  self.onConnect = function(socket){
    socket.on('keyPress', function(data){
      if(data.inputId == 'left')
        self.pressingLeft = data.state;
      else if(data.inputId == 'right')
        self.pressingRight = data.state;
      else if(data.inputId == 'up')
        self.pressingUp = data.state;
      else if(data.inputId == 'down')
        self.pressingDown = data.state;
      else if(data.inputId === 'attack')
        self.pressingAttack = data.state;
      else if(data.inputId === 'mouseAngle')
        self.mouseAngle = data.state;
    });
  }

  playerList[self.id] = self;
  initPack.player.push({
    id:self.id,
    x:self.x,
    y:self.y,
    number: self.number,
  });
  return self;
}
