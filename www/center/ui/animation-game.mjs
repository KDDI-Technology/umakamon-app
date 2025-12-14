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
const ADDSCORE_COUNT_TIME = 12;

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
  getStatus(){
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
    this.countdownContainer.position.set(this.app.screen.width/2,this.app.screen.height/2);
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
      fontSize:60,
      fill:0x8800FF,
      stroke: 0xffffff,
      strokeThickness: 6
    });
    this.scoreText = new PIXI.Text("得点 0 pt", this.scoreStyle);
    this.scoreText.anchor.set(0.5,0);
    const posx = (this.app.screen.width/4)*3;
    this.scoreText.position.set(posx,20);

    this.ptimeStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:60,
      fill:0x0000FF,
      stroke: 0xffffff,
      strokeThickness: 4
    });
    this.ptimeText = new PIXI.Text("残り 30 秒", this.ptimeStyle);
    this.ptimeText.anchor.set(0.5,0);
    this.ptimeText.position.set(this.app.screen.width / 4,20);

    this.addScoreStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:240,
      fill:0x30FFA0,
      stroke: 0xffffff,
      strokeThickness: 8
    });
    this.addScoreText = new PIXI.Text("+", this.addScoreStyle);
    this.addScoreText.scale.set(0.2);
    this.addScoreText.anchor.set(0.5,0.5);
    this.addScoreText.position.set(this.app.screen.width/2,this.app.screen.height/2);
    this.addScoreText.visible = false;

    this.playingContainer = new PIXI.Container();
    this.playingContainer.addChild(this.scoreText);
    this.playingContainer.addChild(this.ptimeText);
    this.playingContainer.addChild(this.addScoreText);
    this.playingContainer.visible = false;
    this.app.stage.addChild(this.playingContainer);
  }
  startPlaying(){
    this.status = 2;
    this.score = 0;
    this.ptimeText.text = "残り 30 秒";
    this.scoreText.text = "得点 0 pt";
    this.playingContainer.visible = true;
    this.playStartTime = Date.now();
    this.playPrevTime = this.playStartTime;
    this.playCounter = 30;
    this.addScoreCounter = 0;
    this.addScoreText.scale.set(0.2);
  }
  updatePlaying(){
    if(this.status != 2){
      return;
    }
    const now = Date.now();
    if(now >= (this.playPrevTime + 1000)){
      this.playCounter --;
      if(this.playCounter == 0){
        console.log("playing end");
        this.startResult();
        this.endPlaying();
      }
      this.playPrevTime += 1000;
      this.ptimeText.text = "残り "+this.playCounter+" 秒";
    }
    if((this.tickCount % 5) == 4){ // 1秒に6回更新
      this.scoreText.text = "得点 "+this.score+" pt";
    }
    if(this.addScoreCounter > 0){
      console.log("addScoreCounter="+this.addScoreCounter);
      this.addScoreCounter --;
      this.addScoreText.scale.x *= 1.1;
      this.addScoreText.scale.y *= 1.1;
      this.addScoreText.rotation += 0.1;
      if(this.addScoreCounter == 0){
        this.addScoreText.visible = false;
      }
    }
    this.tickCount ++;
  }
  addScore(score){
    console.log("game.addScore() score="+score);
    this.score += score;
    this.addScoreText.text = "+"+score;
    this.addScoreCounter = ADDSCORE_COUNT_TIME;
    this.addScoreText.visible = true;
    let scale=0.2;
    if((score >= 10)&&(score < 30)){
      scale = 0.5;
    }else if((score >= 30)&&(score < 50)){
      scale = 1;
    }else if((score >= 50)&&(score < 60)){
      scale = 2;
    }
    this.addScoreText.scale.set(scale);
  }
  endPlaying(){
    this.playingContainer.visible = false;
    this.addScoreText.scale.set(0.2);
  }

  /////////////////////////////////////
  // Result
  /////////////////////////////////////
  // おつかれさまでした！→最終的な点数表示を全画面で10秒間実施
  initResult(){
  }
  startResult(){
    this.status = 3;
  }
  updateResult(){

  }  
  endResult(){
    this.status = 0;
  }

  /////////////////////////////////////
  // resize
  /////////////////////////////////////
  resize(){
    this.countdownContainer.position.set(this.app.screen.width/2,this.app.screen.height/2);
    const posx = (this.app.screen.width/4)*3;
    this.scoreText.position.set(posx,20);
    this.ptimeText.position.set(this.app.screen.width / 4,20);
    this.addScoreText.position.set(this.app.screen.width/2,this.app.screen.height/2);
  }

}
export default game;
