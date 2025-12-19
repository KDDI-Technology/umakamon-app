import * as PIXI from '/libs/pixi.min-v6.2.1.mjs';
import MIDI from "/libs/pomidi.mjs";

const CHICKEN_IMAGE = "/img/chicken.png";

const DEB = false;

class chicken{
  constructor(app,atx){
    this.app = app;
    this.atx = atx;
    this.midi = null;
    this.chickenTimer = null;
    this.#initChicken();
  }
  async init(){
    if(DEB) console.log("chicken.init()");
    this.#initChicken();
    this.midi = new MIDI();
    this.midi = await this.midi.init();
    this.midi.setHandler(this.#onMIDI.bind(this),"XIAO RP2040");
  }
  setOnChicken(func){
    this.onChicken = func;
  }
  update(){
    this.#updateChicken();
  }
  #onMIDI(e){
    const message = e.data[0] & 0xf0;
    if(DEB) console.log("chicken.onMIDI() mes: "+message+" d1:"+e.data[1]+" d2:"+e.data[2]);
    switch (message){
    case 0x90 :
      switch(e.data[1]){
      case 100:
        if(this.chickenTimer != null){
          break;
        }
        this.#startChicken();
        if(this.onChicken){
          this.onChicken();
        }
        this.chickenTimer = setTimeout(()=>{
          this.chickenTimer = null;
        },7000);
        break;
      default:break;
      }
      break;
    default :
      break;
    }
  }
  #initChicken(){
    this.chickenContainer = new PIXI.Container();
    this.app.stage.addChild(this.chickenContainer);
    let chickenTex = PIXI.Texture.from(CHICKEN_IMAGE);
    this.chickenSpr = PIXI.Sprite.from(chickenTex);
    this.chickenSpr.anchor.x = 0.5;
    this.chickenSpr.anchor.y = 0.1;
    this.chickenSpr.scale.x = 0.1;
    this.chickenSpr.scale.y = 0.1;
    this.chickenSpr.visible = false;
    this.#resetChicken();
    this.chickenContainer.addChild(this.chickenSpr);
  }
  #startChicken(){
    this.chickenStarted = true;
    this.chickenSpr.visible = true;
    if(this.chickenTimer != null){
      clearTimeout(this.chickenTimer);
      this.chickenTimer = null;
    }
    this.chickenTimer = setTimeout(()=>{
      console.log("startChicken() timeout");
      this.#stopChicken();
    },3000);
  }
  #stopChicken(){
    this.chickenStarted = false;    
    this.chickenSpr.scale.x = 0.1;
    this.chickenSpr.scale.y = 0.1;
    this.chickenSpr.rotation = 0;
    this.chickenSpr.visible = false;
  }
  #updateChicken(){
    if(this.chickenStarted){
      this.chickenSpr.rotation += 0.2;
      this.chickenSpr.scale.x += 0.03;
      this.chickenSpr.scale.y += 0.03;
    }
  }
  #resetChicken(){
    this.chickenSpr.position.set(this.app.screen.width/2,(this.app.screen.height/2)-6);
  }

  /////////////////////////////////////
  // resize
  /////////////////////////////////////
  resize(){
    this.#resetChicken();
  }
}
export default chicken;
