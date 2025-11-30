// onebutton.mjs
// (C)2024 by D.F.Mac.@TripArts Music

import pomidi from "./pomidi.mjs";

class OneButton{
  constructor(){
    this.midi = null;
    this.deviceNames = [];
    this.onchange = null;
  }
  async init(){
    console.log("OneButton.init()");
    let midi = new pomidi();
    this.midi = await midi.init();
    if(this.midi != null){
      this.midi.setOnChange(this._onChange.bind(this));
      await this._getDeviceList();
    }
    if(this.midi == null){
      return null;
    }else{
      return this;
    }
  }
  _getDeviceList(){
    console.log("OneButton._getDeviceList()====>");
    this.deviceNames = [];
    let devCnt = 0;

    for(var cnt=0;cnt<this.midi.outputs.length;cnt++){
      let device = this.midi.outputs[cnt].name;
      if(device.startsWith("mi:muz:btn-")){
        devCnt ++;
        this.deviceNames.push(device);
      }
    }
    this.midi.setHandler(this._onMidiEvent.bind(this),this.deviceNames);
  }
  _onMidiEvent(e,device){
    console.log("OneButton._onMidiEvent()");
    let message = e.data[0] & 0xF0;
    let ch = e.data[0] & 0x0F;
    let num = e.data[1];
    let val = e.data[2];
    console.log("["+device+"] mes:0x"+message.toString(16)+" ch:"+ch+" num:"+num+" val:"+val);
    let bName = "";
    if(message == 0x90){ // note on
      switch(num){
      case 110:
        if(this.onButton != null){
          if(val != 0){
            this.onButton(num,val,device);
          }
        }
        break;
      default:break;
      }      
    }
  }
  _onChange(){
    console.log("OneButton._onChange()");
    this._getDeviceList();
    if(this.onChange != null){
      this.onChange(this.deviceNames);
    }
  }
  setOnChange(func){
    console.log("OneButton.setOnChange()");
    this.onChange = func;
  }
  setOnButton(func){
    console.log("OneButton.setOnButton()");
    this.onButton = func;
  }
  wait(ms){
    return new Promise((resolve)=>{setTimeout(resolve,ms);});
  }
}

export default OneButton;