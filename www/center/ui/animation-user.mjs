import * as PIXI from '/libs/pixi.min-v6.2.1.mjs';

const DEB = false;

const faces = [
  '/img/nagasaki/1.png',
  '/img/nagasaki/2.png',
  '/img/nagasaki/3.png',
  '/img/nagasaki/4.png',
  '/img/nagasaki/5.png',
  '/img/nagasaki/6.png',
  '/img/nagasaki/7.png',
  '/img/nagasaki/8.png',
  '/img/nagasaki/9.png'
];

class userAnimation{
  constructor(app){
    this.app = app;
    this.users = [];
    this.svgTexures = {};
    this.baseContainer = null;
    this.faceTexures = [];
    this.tick = 0;
  }
  init(){
    if(DEB) console.log("game.init()");
    this.status = 0;
    this.baseContainer = new PIXI.Container();
    this.app.stage.addChild(this.baseContainer);
    this.#initFaceTexures();
    this.#initUsers();
  }
  #initFaceTexures(){
    this.faceTexures = [];
    for(let cnt=0;cnt<faces.length;cnt++){
      let tex = PIXI.Texture.from(faces[cnt]);
      this.faceTexures.push(tex);
    }
  }
  update(){
    this.#updateUsers();
  }

  /////////////////////////////////////
  // Users
  /////////////////////////////////////

  #initUsers(){
    for(let cnt=this.users.length-1;cnt>=0;cnt--){
      this.users[cnt].destroy({children:true,texture:true});
      this.users[cnt] = null;
      this.users.splice(cnt,1);
    }
    this.baseContainer.removeChildren();
  }
  addUser(ud){
    // ud = {name,icon,index=(face index),score}
    const faceSpr  = new PIXI.Sprite(this.faceTexures[ud.index]);
    faceSpr.width = 40;
    faceSpr.height = faceSpr.texture.height / faceSpr.texture.width * 40;
    faceSpr.anchor.set(0,0);
    faceSpr.pivot.set(0,faceSpr.height/2);
    faceSpr.position.set(60,0);

    const nameStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:12,
      fill:0x000000,
      stroke: 0xffffff,
      strokeThickness: 3
    });
    const nameText = new PIXI.Text(ud.name, nameStyle);
    nameText.anchor.set(0,0);
    nameText.pivot.set(0,nameText.height/2);
    nameText.position.set(20,0);

    const scoreStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:14,
      fill:0xFF0000,
      stroke: 0xffffff,
      strokeThickness: 3
    });
    const scoreText = new PIXI.Text("+"+ud.score, scoreStyle);
    scoreText.anchor.set(0,0);
    scoreText.pivot.set(0,scoreText.height/2);
    scoreText.position.set(60,0);

    // todo: user icon svg の追加

    const userContainer = new PIXI.Container();
    userContainer.addChild(faceSpr);
    userContainer.addChild(nameText);
    userContainer.addChild(scoreText);

    const h = Math.floor(Math.random()*(this.app.screen.height/3));
    userContainer.position.set(-100,h);
    userContainer.speed =  Math.floor(Math.random()*10)+4;
    this.users.push(userContainer);
    this.baseContainer.addChild(userContainer);
  }
  #updateUsers(){
    let removeUsers = [];
    for(let cnt=this.users.length-1;cnt>=0;cnt--){
      this.users[cnt].position.x += this.users[cnt].speed;
      const face = this.users[cnt].children[0];
      const score = this.users[cnt].children[2];
      if((this.tick % 16) > 7){
        score.scale.x += 0.1;
        score.scale.y += 0.1;
      }else{
        score.scale.x -= 0.1;
        score.scale.y -= 0.1;
      }
      if((this.tick % 16) == 1){
        face.scale.x *= 2;
        face.scale.y *= 2;
      }
      if((this.tick % 16) == 9){
        face.scale.x *= 0.5;
        face.scale.y *= 0.5;
      }
      face.rotation += 0.01;

      if(this.users[cnt].position.x >= (this.app.screen.width+100)){
        removeUsers.push(this.users[cnt]);
      }
    }
    while(removeUsers.length != 0){
      const user = removeUsers.pop();
      if(user.parent){
        user.parent.removeChild(user);
      }
      user.destroy({children:true});
      const index =  this.users.indexOf(user);
      if(index >= 0){
        this.users.splice(index,1);
      }
    }
    this.tick++;
    if(this.tick > 60000){
      this.tick = 0;
    }
  }

  /////////////////////////////////////
  // resize
  /////////////////////////////////////
  resize(){
  }

}
export default userAnimation;
