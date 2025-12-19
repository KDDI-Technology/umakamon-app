// voices.mjs
// (C)2025 by D.F.Mac.@TripArts Music

import Posmp from "./posmp2.mjs";

const DEB = false;

const samples = [
  "/wav/voices/3.wav",
  "/wav/voices/2.wav",
  "/wav/voices/1.wav",
  "/wav/voices/start.wav",
  "/wav/voices/owari.wav",
  "/wav/voices/whistle.mp3",
  "/wav/voices/whistle2.mp3"
];

const VELOCITY = 1.4;

class voicePlayer{
  constructor(context) {
    this.path = null;
    this.loaded = false;
    this.samplers = [];
    this.context = context;
    this.context.resume();
    this.gain = 0.5;
  }
  setContext(ctx){
    this.context = ctx;
    for(let key in this.samplers){
      this.samplers[key].smp.setContext(ctx);
    }
  }
  async load(){
    if(DEB) console.log("voicePlayer.load()");
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
    return this.samplers;
  }
  async _loadSample(sample){
    if(DEB) console.log("voicePlayer._loadSample() sample="+sample);
    return new Promise((resolve)=>{
　　　 let sampler = new Posmp(this.context);
      sampler.init(sample).then((_smp)=>{
        resolve({smp:_smp});
      });
    });
  }
  setGain(volume){
    if(DEB) console.log("voicePlayer.setGain() volume="+volume);
    this.gain = volume;
  }
  playTag(at,tag,_velocity){
    if(DEB) console.log("voicePlayer.playTag() at="+at+" tag="+tag+" vel="+_velocity);
    let index = null;
    switch(tag){
    case "3":
    case 3:
      index = 0;
      break;
    case "2":
    case 2:
      index = 1;
      break;
    case "1":
    case 1:
      index = 2;
      break;
    case "0":
    case "start":
    case 0:
      index = 3;
      break;
    case "owari":
    case "end":
      index = 4;
      break;
    case "whistle":
    case "fue":
      index = 5;
      break;
    case "whistle2":
    case "fue2":
      index = 6;
      break;
    default:
      break;
    }
    if(index != null){
      this.play(at,index,_velocity);
    }else{
      console.error("invalid tag ="+tag);
    }
  }
  play(at,index,_velocity){
    if(DEB) console.log("voicePlayer.play() at="+at+" index="+index+" vel="+_velocity);
    this.context.resume();
    let sampler = this.samplers[index].smp;
    let _when = at;
    sampler.play({when:_when},(this.gain*_velocity));
  }
  polyPlay(at,indexes){
    if(DEB) console.log("voicePlayer.polyPlay() at="+at);
    for(let cnt=0;cnt<indexes.length;cnt++){
      this.play(at,indexes[cnt],VELOCITY);
    }
  }
}

export default voicePlayer;
