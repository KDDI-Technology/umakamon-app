// efxPlayer.mjs
// (C)2024 by D.F.Mac.@TripArts Music

import Posmp from "/libs/posmp2.mjs";
import Cans from "/libs/canout.mjs";

const DEB = false;

const samples = [
  "/wav/efx/1.mp3",
  "/wav/efx/2.mp3",
  "/wav/efx/3.mp3"
];

const VELOCITY = 1.4;

class efxPlayer{
  constructor(context) {
    this.path = null;
    this.loaded = false;
    this.samplers = [];
    this.sapmlers2 = [];
    this.context = context;
    this.context.resume();
    this.gain = 0.5;
    this.cans = null;
    this.canMode = false; // true=on false=off
  }
  setContext(ctx){
    this.context = ctx;
    for(let key in this.samplers){
      this.samplers[key].smp.setContext(ctx);
    }
  }
  setCanMode(onOff){
    this.canMode = onOff;
  }
  async load(){
    if(DEB) console.log("efxPlayer.load()");
    this.cans = new Cans();
    await this.cans.init();
    let res = [];
    let resPromises = [];
    for(let cnt=0;cnt<samples.length;cnt++){
      resPromises.push(this._loadSample(samples[cnt]));
    };
    res = await Promise.all(resPromises);
    for(let cnt=0;cnt<res.length;cnt++){
      this.samplers.push(res[cnt]);
    }
    this.loaded = true;
    return {sampler:this.samplers,sampler2:this.samplers2};
  }
  async _loadSample(sample){
    if(DEB) console.log("efxPlayer._loadSample() sample="+sample);
    return new Promise((resolve)=>{
　　　 let sampler = new Posmp(this.context);
      sampler.init(sample).then((_smp)=>{
        resolve({smp:_smp});
      });
    });
  }
  setGain(volume){
    if(DEB) console.log("efxPlayer.setGain() volume="+volume);
    this.gain = volume;
  }
  play(at,index,_velocity){
    if(DEB) console.log("efxPlayer.play() at="+at+" index="+index+" vel="+_velocity);
    this.context.resume();
    let sampler = this.samplers[index].smp;
    let _when = at;
    sampler.play({when:_when},(this.gain*_velocity));
    if(this.canMode){
      this.cans.play(index%8);
    }
  }
  playSoundOnly(at,index,_velocity){
    if(DEB) console.log("efxPlayer.playSoundOnly() at="+at+" index="+index+" vel="+_velocity);
    this.context.resume();
    let sampler = this.samplers[index].smp;
    let _when = at;
    sampler.play({when:_when},(this.gain*_velocity));
  }
  polyPlay(at,indexes){
    if(DEB) console.log("efxPlayer.polyPlay() at="+at);
    for(let cnt=0;cnt<indexes.length;cnt++){
      this.play(at,indexes[cnt],VELOCITY);
    }
  }
}

export default efxPlayer;
