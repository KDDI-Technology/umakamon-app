import * as PIXI from './pixi.min-v6.2.1.mjs';

const DEB = false;

PIXI.settings.RENDER_OPTIONS.autoResize = true;
PIXI.settings.RESOLUTION = 1;

let CONTENT_WIDTH = window.innerWidth;
let CONTENT_HEIGHT = window.innerHeight;
const BEAT_EFFECT_MAX = 12;

const faces = [
  './img/nagasaki/1.png',
  './img/nagasaki/2.png',
  './img/nagasaki/3.png',
  './img/nagasaki/4.png',
  './img/nagasaki/5.png',
  './img/nagasaki/6.png',
  './img/nagasaki/7.png',
  './img/nagasaki/8.png'
];

const BG_LINES = 48;
const MAX_BG_TICKS = 120;

let isBgExist = false;
let dispCont = 0;
let rotatecnt = 0;
let rotationSpeed = 0.1; //(Math.random() * 0.1)+0.005;

const colors = [
  0xFF0080,
  0xFFBA00,
  0x1CDB1C,
  0xFF3A00,
  0x4768E6,
  0x00B3FF,
  0xAE0BBF
];

class animation{
  constructor(){
    this.app = null;
    this.resizeTimer = null;
    this.wrapper = null;
    this.nowFaceIdx = null;
  }
  init(wrapper){
    if(DEB) console.log("animation.init()");
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      transparent:true,
      antialias: true
    });

    this.wrapper = wrapper;
    this.wrapper.appendChild(this.app.view);

    this.app.ticker.maxFPS = 20;
    this.app.ticker.speed = 0.5;
    this.app.ticker.add((delta) => {
      this.updateBgLines();
      this.updateFaces();
    });
    this.initBgLines();
    this.initFaces();
  }

  ///////////////////////////////////////////////////////////////////////
  // Background Animation
  initBgLines(){
    this.bgContainer = new PIXI.Container();
    this.app.stage.addChild(this.bgContainer);
    this.grpContainer = new PIXI.Container();
    this.bgContainer.addChild(this.grpContainer);
    this.grpContainer.position.set(CONTENT_WIDTH / 2, CONTENT_HEIGHT / 2);
    this.grpContainer.pivot.x = CONTENT_WIDTH/2; 
    this.grpContainer.pivot.y = CONTENT_HEIGHT/2; 
  }
  drawBgLine(){
    rotatecnt += 1;
    let lineSize;
    let line = new PIXI.Graphics();
    let color = colors[Math.floor(Math.random() * colors.length)];
    line.beginFill(color);
    line.moveTo(0,0);
    if(CONTENT_WIDTH > CONTENT_HEIGHT){
      lineSize = CONTENT_WIDTH * 1.5;
    }else{
      lineSize = CONTENT_HEIGHT * 1.5;
    }
    line.lineTo(lineSize,-150);
    line.lineTo(lineSize,150);
    line.lineTo(0,0);
    line.endFill();
    let lineContainer = new PIXI.Graphics();
    lineContainer.position.set(CONTENT_WIDTH / 2, CONTENT_HEIGHT / 2);
    lineContainer.rotation = rotatecnt;
    lineContainer.pivot.x = 0; 
    lineContainer.pivot.y = 0; 
    lineContainer.addChild(line);
    this.grpContainer.addChild(lineContainer);
  }
  startBgLines(){
    isBgExist = true;
    dispCont = 0;
    this.grpContainer.removeChildren();
    for(let i=0;i<BG_LINES;i++){
      this.drawBgLine();
    }
  }
  stopBgLines(){
    this.grpContainer.removeChildren();
    isBgExist = false;
    dispCont = 0;
  }
  updateBgLines(){
    if(isBgExist){
      dispCont ++;
      if(dispCont > MAX_BG_TICKS){
        this.grpContainer.removeChildren();
        isBgExist = false;
        dispCont = 0;
        this.startBgLines();
      }else{
        this.grpContainer.rotation +=rotationSpeed;
      }
    }
  }

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
      this.faceSpr[this.nowFaceIdx].scale.x = 1;
      this.faceSpr[this.nowFaceIdx].scale.y = 1;
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
}

export default animation;
