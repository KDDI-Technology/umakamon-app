// canout.mjs
// Simple output only Driver for mi:muz:can-RP2040
// (C)2025 by D.F.Mac.@TripArts Music

import pomidi from "./pomidi.mjs";

const canNoteNums = [36,38,40,41,43,45,47,48];

class CanOut{
  constructor(){
    this.midi = null;
    this.deviceNames = [];
    this.onchange = null;
  }
  async init(){
    console.log("CanOut.init()");
    let midi = new pomidi();
    this.midi = await midi.init();
    if(this.midi != null){
      this.midi.setOnChange(this.#onChange.bind(this));
      await this.#getDeviceList();
    }
    if(this.midi == null){
      return null;
    }else{
      return this;
    }
  }
  setOnChange(func){
    this.onchange = func;
  }
  #getDeviceList(){
    console.log("CanOut.#getDeviceList()====>");
    this.deviceNames = [];
    let devCnt = 0;

    for(var cnt=0;cnt<this.midi.outputs.length;cnt++){
      let device = this.midi.outputs[cnt].name;
      if(device.startsWith("mi:muz:can-rp2040-")){
        devCnt ++;
        this.deviceNames.push(device);
      }
    }
  }
  #onChange(){
    console.log("CanOut._onChange()");
    this.#getDeviceList();
    if(this.onchange != null){
      this.onchange(this.deviceNames);
    }
  }
  play(index,name){
    console.log("canout.play() index="+index);
    let target = [];
    let _index = index % canNoteNums.length;
    if(name == undefined){
      target = this.deviceNames;
    }else{
      for(let cnt=0;cnt<this.deviceNames.length;cnt++){
        if(name == this.deviceNames[cnt]){
          target.push(name);
          break;
        }
      }
    }
    console.log("canout.play() target.length="+target.length);
    for(let cnt=0;cnt<target.length;cnt++){
      console.log("target="+target[cnt]);
      this.midi.sendNoteOn(1,canNoteNums[_index],100,[target[cnt]]);
    }
  }
  getDevices(){
    return this.deviceNames;
  }
  wait(ms){
    return new Promise((resolve)=>{setTimeout(resolve,ms);});
  }
}

export default CanOut;