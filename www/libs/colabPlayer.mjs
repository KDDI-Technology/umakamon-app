// colabPlayer.mjs
// (C)2024 by D.F.Mac.@TripArts Music

import Posmp from "./posmp2.mjs";

const DEB = false;

const samples = [
  "../wav/colab/1.wav",
  "../wav/colab/2.wav",
  "../wav/colab/3.wav",
  "../wav/colab/4.wav",
  "../wav/colab/5.wav",
  "../wav/colab/6.wav",
  "../wav/colab/7.wav",
  "../wav/colab/8.wav",
  "../wav/colab/9.wav",
  "../wav/colab/10.wav",
  "../wav/colab/11.wav",
  "../wav/colab/12.wav",
  "../wav/colab/13.wav",
  "../wav/colab/14.wav",
  "../wav/colab/15.wav",
  "../wav/colab/16.wav"
];

const VELOCITY = 1.4;

class colabPlayer{
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
    if(DEB) console.log("colabPlayer.load()");
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
    if(DEB) console.log("colabPlayer._loadSample() sample="+sample);
    return new Promise((resolve)=>{
　　　 let sampler = new Posmp(this.context);
      sampler.init(sample).then((_smp)=>{
        resolve({smp:_smp});
      });
    });
  }
  setGain(volume){
    if(DEB) console.log("colabPlayer.setGain() volume="+volume);
    this.gain = volume;
  }
  play(at,index,_velocity){
    if(DEB) console.log("colabPlayer.play() at="+at+" index="+index+" vel="+_velocity);
    let sampler = this.samplers[index].smp;
    let _when = at;
    sampler.play({when:_when},(this.gain*_velocity));
  }
  polyPlay(at,indexes){
    if(DEB) console.log("colabPlayer.polyPlay() at="+at);
    for(let cnt=0;cnt<indexes.length;cnt++){
      this.play(at,indexes[cnt],VELOCITY);
    }
  }
}

export default colabPlayer;
