// posmp2.mjs
//
// Simple Web Audio Sampler 2
//
// (CCby4.0) 2018-2023 D.F.Mac.@TripArts Music

const LOGLEVEL = 0; // 0: none, 1: errLog only, 2: inoLog+errLog
let instanceCount = 0;

const MAX_NOTES = 3;
const DEFAULT_SAMPLE_GAIN = 1.0;

class posmp2 {
  constructor(context){
    this.audioctx = null;
    this.sampleGain = DEFAULT_SAMPLE_GAIN;
    if(context != undefined){
      this.audioctx = context;
    }
  }
  init(src){
    return new Promise((resolve,reject)=>{
      this.uid = instanceCount;
      instanceCount ++;
      infoLog("posmp("+this.uid+"):init() with:["+src+"]");
      if(this.audioctx == null){
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        this.audioctx = new AudioContext();
      }
      this.masterVolume = this.audioctx.createGain();
      this.masterVolume.connect(this.audioctx.destination);
      this.sampleVolume = this.audioctx.createGain();
      this.sampleVolume.connect(this.masterVolume);
      this.sampleVolume.gain.value = this.sampleGain;

      this.buffer = null;
      this.bufSrc = [];
      for(let cnt=0;cnt<MAX_NOTES;cnt++){
        this.bufSrc[cnt] = null;
      }
      this.nextBufSrcIdx = 0;
      this.gStarted = false;
      if(src != null){
        this.src = src;
        this._load(this.src).catch((err)=>{
          errLog("posmp("+this.uid+"):init()->load() :"+this.src+" error");
          reject(err);
        }).then(()=>{
          infoLog("posmp("+this.uid+"):init()->load() :"+this.src+" done");
          resolve(this);
        });
      }else{
        infoLog("posmp("+this.uid+"):init() only -> done");
        resolve(this);
      }
    });
  }
  setContext(ctx){
    this.audioctx = ctx;
    this.masterVolume = this.audioctx.createGain();
    this.masterVolume.connect(this.audioctx.destination);
    this.sampleVolume = this.audioctx.createGain();
    this.sampleVolume.connect(this.masterVolume);
    this.sampleVolume.gain.value = this.sampleGain;
  }
  setGain(gain,at){
//    console.log("setGain() gain="+gain);
    if(this.sampleVolume != null){
      this.sampleGain = DEFAULT_SAMPLE_GAIN * gain;
      if(at == undefined){
        this.sampleVolume.gain.value = this.sampleGain;
      }else{
        this.sampleVolume.gain.linearRampToValueAtTime(this.sampleGain,at);
      }
    }
  }
  _load (src){
    return new Promise((resolve,reject)=>{
      infoLog("posmp("+this.uid+"):load("+src+") start");
      fetch(src).then((res)=>{
        if(res.ok){
          infoLog("posmp("+this.uid+"):fetch() OK");
          return res.arrayBuffer();
        }else{
          throw new Error(res.status);
        }
      }).catch((e)=>{
        errLog("posmp("+this.uid+"):load() ERROR:"+e);
        reject(e);
      }).then(async (buf)=>{
        this.buffer = null;
//        let tempActx = new AudioContext();
//        let buffer = await tempActx.decodeAudioData(buf);
        this.buffer = await this.audioctx.decodeAudioData(buf);
//        this.buffer = this.cloneAudioBuffer(buffer);
//        buffer = null;
//        await tempActx.close();
//        tempActx = null;
        resolve();
      });
    });
  }
  cloneAudioBuffer(fromAudioBuffer) {
    const audioBuffer = new AudioBuffer({
      length:fromAudioBuffer.length, 
      numberOfChannels:fromAudioBuffer.numberOfChannels, 
      sampleRate:fromAudioBuffer.sampleRate
    });
    for(let channelI = 0; channelI < audioBuffer.numberOfChannels; ++channelI) {
      const samples = fromAudioBuffer.getChannelData(channelI);
      audioBuffer.copyToChannel(samples, channelI);
    }
    return audioBuffer;
  }
  play(opt,volume){
    let vol = (volume != undefined)? volume : 0.7;
    infoLog("posmp("+this.uid+"):play()");
    if(this.buffer != null){
      this.audioctx.resume();
      if(this.bufSrc[this.nextBufSrcIdx] != null){
        this.bufSrc[this.nextBufSrcIdx].disconnect();
        this.bufSrc[this.nextBufSrcIdx].buffer = null;
        this.bufSrc[this.nextBufSrcIdx] = null;
      }
      let src = this.audioctx.createBufferSource();
      let when = 0;
      src.playbackRate.value = 1.0;
//      console.log("@@@@@ src.playbackRate >>>>");
//      console.dir(src.playbackRate);
      src.loopStart = 0;
      src.loop = false;
      src.loopEnd = this.buffer.duration;
      infoLog("posmp("+this.uid+")buffer.duration:"+this.buffer.duration);
      if(opt){
        if(typeof opt.rate === 'number'){
          src.playbackRate.value = opt.rate;
        }
        if(typeof opt.loop === 'number'){
          src.loop = opt.loop;
        }
        if(typeof opt.lstart === 'number'){
          src.loopStart = opt.lstart;
        }
        if(typeof opt.lend === 'number'){
          src.loopEnd = opt.lend;
        }
        if(typeof opt.when === 'number'){
          let ct = this.audioctx.currentTime;
          let duration = opt.when - ct;
//          console.log("play() duration="+duration)

          when = opt.when;
        }

      }
      src.buffer = this.buffer;
      this.masterVolume.gain.value = vol;
      src.connect(this.sampleVolume);
      src.start(when);
      this.bufSrc[this.nextBufSrcIdx] = src;
      this.nextBufSrcIdx ++;
      this.nextBufSrcIdx %= MAX_NOTES;
    }
  }
  resume(){
    infoLog("posmp("+this.uid+"):resume()");
    if(this.buffer != null){
      this.audioctx.resume();
    }
  }
  stop(){
    for(let cnt=0;cnt<MAX_NOTES;cnt++){
      if(this.bufSrc[cnt] != null){
        this.bufSrc[cnt].disconnect();
        this.bufSrc[cnt].buffer = null;
        this.bufSrc[cnt] = null;
      }
    }
    this.masterVolume.disconnect();
    this.buffer = null;
  }
  wait(ms){
    infoLog("posmp("+this.uid+"):wait()");
    return new Promise((resolve)=>{setTimeout(resolve,ms);});
  }
}

let infoLog = (str)=>{};
let errLog = (str)=>{};
let setLogLevel = function(log){
  if(log > 1){
    infoLog = console.log.bind(console, "%c%s", "color:blue;");
  }
  if(log > 0){
    errLog = console.log.bind(console, "%c%s", "color:red;font-weight:bold;");
  }
};

setLogLevel(LOGLEVEL);

export default posmp2;
