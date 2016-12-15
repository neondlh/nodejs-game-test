var Entity = require('./Entity.js');

module.exports = function (parent, angle, playerList, bulletList){
  var self = Entity();
  self.id = Math.random();
  self.spdX = Math.cos(angle/180*Math.PI) * 10;
  self.spdY = Math.sin(angle/180*Math.PI) * 10;
  self.parent = parent;
  self.timer = 0;
  self.toRemove = false;
  self.playerList = playerList;
  self.bulletList = bulletList;
  var super_update = self.update;

  self.update = function(){
    if(self.time ++> 100)
      self.toRemove = true;
    super_update();

    for(var i in playerList){
      var p = playerList[i];
      if(self.getDistance(p) < 32 && self.parent !== p.id){
        //handle collision. ex: hp--;
        console.log("removing bullet");
        self.toRemove = true;
      }
    }
  }

  bulletList[self.id] = self;
  return self;
}
