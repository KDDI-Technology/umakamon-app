// spongeMIDI.mjs
// spongeMIDI device driver
// (C)2025 by KDDI Technology
// Programmed by H.Kodama (D.F.Mac.@TripArts Music)

import pomidi from "./pomidi.mjs";

class spongeMIDI{
  constructor(){
    this.midi = null;
    this.deviceNames = [];
    this.onchange = null;
    this.onSponge = null;
  }
  async init(){
    console.log("spongeMIDI.init()");
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
  #getDeviceList(){
    console.log("spongeMIDI._getDeviceList()====>");
    this.deviceNames = [];
    let devCnt = 0;

    for(var cnt=0;cnt<this.midi.outputs.length;cnt++){
      let device = this.midi.outputs[cnt].name;
      if(device.startsWith("spongeMIDI-")){
        devCnt ++;
        this.deviceNames.push(device);
      }
    }
    this.midi.setHandler(this.#onMidiEvent.bind(this),this.deviceNames);
  }
  #onMidiEvent(e,device){
    console.log("spongeMIDI._onMidiEvent()");
    let message = e.data[0] & 0xF0;
    let ch = e.data[0] & 0x0F;
    let num = e.data[1];
    let val = e.data[2];
    console.log("["+device+"] mes:0x"+message.toString(16)+" ch:"+ch+" num:"+num+" val:"+val);
    let bName = "";
    if(message == 0xB0){ // CC
      switch(num){
      case 0x30:
        if(this.onSponge != null){
          if(val != 0){
            this.onSponge(val,device);
          }
        }
        break;
      default:break;
      }      
    }
  }
  #onChange(){
    console.log("spongeMIDI._onChange()");
    this.#getDeviceList();
    if(this.onChange != null){
      this.onChange(this.deviceNames);
    }
  }
  setOnChange(func){
    console.log("spongeMIDI.setOnChange()");
    this.onChange = func;
  }
  setOnSponge(func){
    console.log("spongeMIDI.setOnButton()");
    this.onSponge = func;
  }
  resetOnChange(func){
    console.log("spongeMIDI.resetOnChange()");
    this.onChange = null;
  }
  resetOnSponge(func){
    console.log("spongeMIDI.resetOnSponge()");
    this.onSponge = null;
  }
  wait(ms){
    return new Promise((resolve)=>{setTimeout(resolve,ms);});
  }
}

export default spongeMIDI;