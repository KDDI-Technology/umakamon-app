import * as PIXI from '/libs/pixi.min-v6.2.1.mjs';

const DEB = false;

PIXI.settings.RENDER_OPTIONS.autoResize = true;
PIXI.settings.RESOLUTION = 1;

let CONTENT_WIDTH = window.innerWidth;
let CONTENT_HEIGHT = window.innerHeight;
const BEAT_EFFECT_MAX = 12;

const COUNTDOWN_FV_TIME = 60;         // 1s: チャレンジ開始
const COUNTDOWN_NUM_TIME = 30;        // 1s: 3-1
const COUNTDOWN_PLAYSTART_TIME = 30;  // 1s: スタート
const COUNTDOWN_ANIM_COUNT_TIME = 10; // 10 tick

class game{
  constructor(app){
    this.app = app;
    this.status = 0; // 0: stop 1: countdown 2: playing 3: result
    this.countdownValue = null; // 4: チャレンジ開始 3-1:数字表示 0:スタート!
    this.onGameStatusChange = null; // this.status が変化するタイミングでfire
    this.tickCount = 0;
  }
  init(){
    if(DEB) console.log("game.init()");
    this.status = 0;
    this.initCountDown();
    this.initPlaying();
    this.initResult();
  }
  update(){
    this.updateCountDown();
    this.updatePlaying();
    this.updateResult();
  }
  start(){
    this.status = 1;
    this.startCountDown();
  }
  stop(){
    this.status = 0;
    this.endCountDown();
    this.endPlaying();
    this.endResult();
  }
  getStaus(){
    return this.status;
  }
  setOnGameStatusChange(func){
    this.onGameStatusChange = func;
  }

  /////////////////////////////////////
  // CountDown
  /////////////////////////////////////
  // 開始のカウントダウン。チャレンジ開始！,3,2,1,スタート!

  initCountDown(){
    this.startupStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:180,
      fill:0xFF0000,
      stroke: 0xffffff,
      strokeThickness: 8
    });
    this.countdownText = new PIXI.Text('チャレンジ開始！', this.startupStyle);
    this.countdownText.anchor.set(0.5);
    this.countdownContainer = new PIXI.Container();
    this.countdownContainer.addChild(this.countdownText);
    this.countdownContainer.position.set(CONTENT_WIDTH/2,CONTENT_HEIGHT/2);
    this.countdownContainer.visible = false;
    this.app.stage.addChild(this.countdownContainer);
  }
  startCountDown(){
    this.status = 1;
    this.countdownText.text = "チャレンジ開始！";
    this.countdownContainer.visible = true;
    this.countdownValue = 4;
    this.tickCount = 0;
    this.countdownAnimCnt = COUNTDOWN_ANIM_COUNT_TIME;
  }
  endCountDown(){
    this.tickCount = 0;
    this.countdownValue = -1;
    this.countdownContainer.visible = false;
  }
  updateCountDown(){
    if(this.status != 1){
      return;
    }
    let tickTh = null;
    switch(this.countdownValue){
    case 4:
      tickTh = COUNTDOWN_FV_TIME;
      break;
    case 3:
      tickTh = COUNTDOWN_FV_TIME+COUNTDOWN_NUM_TIME;
      break;
    case 2:
      tickTh = COUNTDOWN_FV_TIME+(COUNTDOWN_NUM_TIME*2);
      break;
    case 1:
      tickTh = COUNTDOWN_FV_TIME+(COUNTDOWN_NUM_TIME*3);
      break;
    case 0:
      tickTh = COUNTDOWN_FV_TIME+(COUNTDOWN_NUM_TIME*3)+COUNTDOWN_PLAYSTART_TIME;
      break;
    default:
      break;
    }
    if(tickTh == null){
      this.countdownValue = null;
      return;
    }
    if(this.tickCount > tickTh){
      this.countdownValue --;
      let text;
      let end = false;
      switch(this.countdownValue){
      case 4:
        text = "チャレンジ開始！";
      case 3:
      case 2:
      case 1:
        text = this.countdownValue;
        break;
      case 0:
        text = "スタート！";
        break;
      default:
        text = "チャレンジ開始！";
        end = true;
        break;
      }
      if(end){
        this.startPlaying();
        this.endCountDown();
        return;
      }
      this.countdownText.text = text;
      this.countdownAnimCnt = COUNTDOWN_ANIM_COUNT_TIME;
    }
    if(this.countdownAnimCnt > 0){
      this.countdownAnimCnt --;
      let scale = 1+(this.countdownAnimCnt*0.1);
      this.countdownText.scale.set(scale);
    }
    this.tickCount ++;
  }

  /////////////////////////////////////
  // Playing
  /////////////////////////////////////
  // ゲーム中の得点表示（画面上部へ）+ カウントダウン表示
  // 
  initPlaying(){
    this.scoreStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:100,
      fill:0x3300FF,
      stroke: 0xffffff,
      strokeThickness: 6
    });
    this.scoreText = new PIXI.Text(0, this.startupStyle);
    this.scoreText.anchor.set(0.5);
    this.scoreContainer = new PIXI.Container();
    this.scoreContainer.addChild(this.scoreText);
    this.scoreContainer.position.set(CONTENT_WIDTH/2,CONTENT_HEIGHT/2);
    this.scoreContainer.visible = false;
    this.app.stage.addChild(this.scoreContainer);
  }
  startPlaying(){
    this.status = 2;
    this.score = 0;
    this.scoreContainer.visible = true;
  }
  updatePlaying(){
    if(this.status != 2){
      return;
    }
    if((this.tickCount % 5) == 4){ // 1秒に6回更新
      this.scoreText.text = this.score;
    }
    this.tickCount ++;
  }
  setScore(score){
    this.score = score;
  }
  endPlaying(){
    this.scoreContainer.visible = false;
  }

  /////////////////////////////////////
  // Result
  /////////////////////////////////////
  // おつかれさまでした！→最終的な点数表示を全画面で10秒間実施
  initResult(){
    this.status = 3;
  }
  startResult(){

  }
  updateResult(){

  }  
  endResult(){
    this.status = 0;
  }

/*
  /////////////////////////////////////
  // faces
  /////////////////////////////////////
  initFaces(){
    this.faceContainer = new PIXI.Container();
    this.faceContainer.position.set(CONTENT_WIDTH/2,CONTENT_HEIGHT/2);
    this.app.stage.addChild(this.faceContainer);
    this.faceTex = [];
    this.faceSpr = [];
    for(let cnt=0;cnt<faces.length;cnt++){
      let tex = PIXI.Texture.from(faces[cnt]);
      this.faceTex.push(tex);
      let spr = new PIXI.Sprite(tex);
      spr.anchor.x = 0.5;
      spr.anchor.y = 0.5;
      spr.scale.x = 0.5;
      spr.scale.y = 0.5;
      this.faceSpr.push(spr);
    }
  }
  addFace(index){
    if(index >= faces.length){
      return;
    }
    this.nowFaceIdx = index;
    this.faceSpr[index].speed = (Math.random() * 2) - 1;
    this.faceContainer.removeChildren();
    this.faceContainer.addChild(this.faceSpr[index]); 
  }
  updateFaces(){
    if(this.nowFaceIdx != null){
      this.faceSpr[this.nowFaceIdx].rotation += this.faceSpr[this.nowFaceIdx].speed;
      this.faceSpr[this.nowFaceIdx].scale.x += 0.1;
      this.faceSpr[this.nowFaceIdx].scale.y += 0.1;
    }
  }
  removeFace(){
    if(this.nowFaceIdx != null){
      this.faceSpr[this.nowFaceIdx].rotation = 0;
      this.faceSpr[this.nowFaceIdx].scale.x = 0.5;
      this.faceSpr[this.nowFaceIdx].scale.y = 0.5;
      this.faceContainer.removeChildren();
      this.nowFaceIdx = null;
    }
  }

  /////////////////////////////////////
  // resize
  /////////////////////////////////////
  resize(w,h){
    if(DEB) console.log("animation.resize()");
    CONTENT_WIDTH = w; // window.innerWidth;
    CONTENT_HEIGHT = h; //window.innerHeight;
    if(this.resizeTimer){
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
    this.resizeTimer = setTimeout(()=>{
      if(DEB) console.log("animation.resize() timeout");
      this.app.renderer.resize(CONTENT_WIDTH, CONTENT_HEIGHT);
      this.faceContainer.position.set(CONTENT_WIDTH/2,CONTENT_HEIGHT/2);
      this.grpContainer.position.set(CONTENT_WIDTH / 2, CONTENT_HEIGHT / 2);
      this.grpContainer.pivot.x = CONTENT_WIDTH/2; 
      this.grpContainer.pivot.y = CONTENT_HEIGHT/2; 
    },50);
  }
*/
}
export default game;
