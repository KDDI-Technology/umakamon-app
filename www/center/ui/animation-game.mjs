import * as PIXI from '/libs/pixi.min-v6.2.1.mjs';
import Voices from "/libs/voices.mjs";

const DEB = false;

const COUNTDOWN_FV_TIME =  120;        // 1s: チャレンジ開始
const COUNTDOWN_NUM_TIME = 60;        // 1s: 3-1
const COUNTDOWN_PLAYSTART_TIME = 60;  // 1s: スタート
const COUNTDOWN_ANIM_COUNT_TIME = 20; // 10 tick
const ADDSCORE_COUNT_TIME = 24;
const RESULT_LATCH_TIME = 5000;       // 5s

class game{
  constructor(app,atx){
    this.app = app;
    this.atx = atx;
    this.status = 0; // 0: stop 1: countdown 2: playing 3: result 4: wait return
    this.countdownValue = null; // 4: チャレンジ開始 3-1:数字表示 0:スタート!
    this.onGameStatusChange = null; // this.status が変化するタイミングでfire
    this.tickCount = 0;
    this.closeWaiting = false;
    this.socket = null;
    this.voices = new Voices(this.atx);
  }
  async init(){
    if(DEB) console.log("game.init()");
    this.status = 0;
    this.initCountDown();
    this.initPlaying();
    this.initResult();
    await this.voices.load();
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
  setSocket(socket){
    this.socket = socket;
  }

  /////////////////////////////////////
  // CountDown
  /////////////////////////////////////
  // 開始のカウントダウン。チャレンジ開始！,3,2,1,スタート!

  initCountDown(){
    const startupStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:180,
      fill:0xFF0000,
      stroke: 0xffffff,
      strokeThickness: 8
    });
    this.countdownText = new PIXI.Text('チャレンジ開始！', startupStyle);
    this.countdownText.anchor.set(0.5);
    this.countdownContainer = new PIXI.Container();
    this.countdownContainer.addChild(this.countdownText);
    this.countdownContainer.position.set(this.app.screen.width/2,this.app.screen.height/2);
    this.countdownContainer.visible = false;
    this.app.stage.addChild(this.countdownContainer);
    this.voiceShot = null;
  }
  startCountDown(){
    this.voices.playTag(null,"whistle",0.6);
    this.status = 1;
    this.countdownText.text = "チャレンジ開始！";
    this.countdownContainer.visible = true;
    this.countdownValue = 4;
    this.tickCount = 0;
    this.voiceShot = null;
    this.countdownAnimCnt = COUNTDOWN_ANIM_COUNT_TIME;
    if(this.onGameStatusChange != null){
      this.onGameStatusChange({status:this.status});
    }
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
    console.log("4");
      tickTh = COUNTDOWN_FV_TIME;
      if(this.voiceShot != this.countdownValue){
        console.log("4 1st");
      }
      this.voiceShot = this.countdownValue;
      break;
    case 3:
    console.log("3");
      tickTh = COUNTDOWN_FV_TIME+COUNTDOWN_NUM_TIME;
      if(this.voiceShot != this.countdownValue){
        console.log("3 1st");
        this.voices.playTag(null,"3",1);
      }
      this.voiceShot = this.countdownValue;
      break;
    case 2:
    console.log("2");
      tickTh = COUNTDOWN_FV_TIME+(COUNTDOWN_NUM_TIME*2);
      if(this.voiceShot != this.countdownValue){
        console.log("2 1st");
        this.voices.playTag(null,"2",0.8);
      }
      this.voiceShot = this.countdownValue;
      break;
    case 1:
    console.log("1");
      tickTh = COUNTDOWN_FV_TIME+(COUNTDOWN_NUM_TIME*3);
      if(this.voiceShot != this.countdownValue){
        console.log("1 1st");
        this.voices.playTag(null,"1",0.8);
      }
      this.voiceShot = this.countdownValue;
      break;
    case 0:
    console.log("0");
      tickTh = COUNTDOWN_FV_TIME+(COUNTDOWN_NUM_TIME*3)+COUNTDOWN_PLAYSTART_TIME;
      if(this.voiceShot != this.countdownValue){
        console.log("0 1st");
        this.voices.playTag(null,"start",0.8);
      }
      this.voiceShot = this.countdownValue;
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
    const scoreStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:60,
      fill:0x8800FF,
      stroke: 0xffffff,
      strokeThickness: 6
    });
    this.scoreText = new PIXI.Text("得点 0 pt", scoreStyle);
    this.scoreText.anchor.set(0.5,0);
    const posx = (this.app.screen.width/4)*3;
    this.scoreText.position.set(posx,20);

    const ptimeStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:60,
      fill:0x0000FF,
      stroke: 0xffffff,
      strokeThickness: 4
    });
    this.ptimeText = new PIXI.Text("残り 30 秒", ptimeStyle);
    this.ptimeText.anchor.set(0.5,0);
    this.ptimeText.position.set(this.app.screen.width / 4,20);

    const addScoreStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:240,
      fill:0x30FFA0,
      stroke: 0xffffff,
      strokeThickness: 8
    });
    this.addScoreText = new PIXI.Text("+", addScoreStyle);
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
    this.voices.playTag(null,"whistle2",0.6);
    this.ptimeText.text = "残り 30 秒";
    this.scoreText.text = "得点 0 pt";
    this.playingContainer.visible = true;
    this.playStartTime = Date.now();
    this.playPrevTime = this.playStartTime;
    this.playCounter = 30;
    this.addScoreCounter = 0;
    this.addScoreText.scale.set(0.2);
    if(this.onGameStatusChange != null){
      this.onGameStatusChange({status:this.status});
    }
  }
  updatePlaying(){
    if(this.status != 2){
      return;
    }
    const now = Date.now();
    if(now >= (this.playPrevTime + 1000)){
      this.voices.playTag(null,"whistle2",0.6);
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
      this.addScoreText.scale.x *= 1.02;
      this.addScoreText.scale.y *= 1.02;
      this.addScoreText.rotation += 0.03;
      if(this.addScoreCounter == 0){
        this.addScoreText.visible = false;
      }
    }
    this.tickCount ++;
  }
  addScore(score,mode){
    console.log("game.addScore() score="+score);
    this.score += score;
    if(mode == "guest"){
      return;
    }
    if(score >= 0){
      this.addScoreText.text = "+"+score;
      this.addScoreText.style.fill = 0x30FFA0;
    }else{
      this.addScoreText.text = score;
      this.addScoreText.style.fill = 0xFF0000;
    }
    this.addScoreCounter = ADDSCORE_COUNT_TIME;
    this.addScoreText.visible = true;
    let scale=0.2;
    let check = Math.abs(score);
    if((check >= 0)&&(check < 50)){
      scale = 0.3;
    }else if((check >= 50)&&(check < 100)){
      scale = 0.6;
    }else if((check >= 100)&&(check < 300)){
      scale = 1;
    }else if((check >= 300)&&(check < 1000)){
      scale = 1.5;
    }else if(check >= 1000){
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
    const resScoreStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:180,
      fill:0xFF0000,
      stroke: 0xffffff,
      strokeThickness: 8
    });
    this.resScoreText = new PIXI.Text(' pt', resScoreStyle);
    this.resScoreText.anchor.set(0.5);
    const resRankStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:80,
      fill:0x003366,
      stroke: 0xffffff,
      strokeThickness: 6
    });
    this.resRankText = new PIXI.Text('あなたの順位は　　位です。', resRankStyle);
    this.resRankText.anchor.set(0.5);
    this.resRankText.position.set(0,this.app.screen.height/4);
    const resRNumStyle = new PIXI.TextStyle({
      fontFamily: 'KTEGAKI',
      fontSize:140,
      fill:0x0000FF,
      stroke: 0xffffff,
      strokeThickness: 8
    });
    this.resRNumText = new PIXI.Text('0', resRNumStyle);
    this.resRNumText.anchor.set(0.5);
    this.resRNumText.position.set(120,this.app.screen.height/4);

    this.resultContainer = new PIXI.Container();
    this.resultContainer.addChild(this.resScoreText);
    this.resultContainer.addChild(this.resRankText);
    this.resultContainer.addChild(this.resRNumText);
    this.resultContainer.position.set(this.app.screen.width/2,this.app.screen.height/2);
    this.resultContainer.visible = false;
    this.app.stage.addChild(this.resultContainer);
  }
  async startResult(){
    this.status = 3;
    this.voices.playTag(null,"whistle",0.6);
    this.resScoreText.text = this.score+" pt";
    this.tickCount = 0;
    let _scores = null;
    this.resultTimer = setTimeout(()=>{
      this.status = 4;
      this.voices.playTag(null,"owari",0.8);
      if(this.closeWaiting){
        this.endSession();
        this.closeWaiting = false;
      }
      if(this.onGameStatusChange != null){
        this.onGameStatusChange({status:this.status});
      }
      this.resultTimer = null;
    },5000);
    if(this.socket != null){
      try{
        const _time = Date.now();
        const res = await this.socket.timeout(3000).emitWithAck("updateCenterScore",{time:_time,score:this.score});
        this.resRNumText.text = res.rank;
        _scores = res.scores;
      }catch(e){
        console.error("updateCenterScore server error = "+err);
      }
    }
    this.resultContainer.visible = true;
    if(this.onGameStatusChange != null){
      this.onGameStatusChange({status:this.status,scores:_scores});
    }
  }
  updateResult(){
    if((this.status != 3)&&(this.status != 4)){
      return;
    }
  }  
  endSession(){
    if(this.status == 4){
      this.status = 0;
      this.score = 0;
      this.resultContainer.visible = false;
      this.closeWaiting = false;
      if(this.onGameStatusChange != null){
        this.onGameStatusChange({status:this.status});
      }
    }else if(this.status == 3){
      this.closeWaiting = true;
    }
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
    this.resultContainer.position.set(this.app.screen.width/2,this.app.screen.height/2);
    this.resRankText.position.set(0,this.app.screen.height/4);
    this.resRNumText.position.set(120,this.app.screen.height/4);
  }

}
export default game;
