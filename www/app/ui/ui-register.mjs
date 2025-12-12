// ui-register.mjs
// umakamon app user registration UI
// (C)2025 by KDDI Technology
// Programmed by H.Kodama (D.F.Mac.@TripArts Music)

import avatar from "/libs/animal-avatar-generator.esm.js";

const html = `
<style>
#uiRegWrap{
  width:100%;
  height:100%;
  background-color:rgba(0,100,0,0.7);
  display:flex;
  color:black;
  box-sizing:border-box;
  justify-content:center;
  align-items:center;
}
#uiRegPad{
  box-sizing:border-box;
  padding:20px;
  max-width:360px;
  height:500px;
}
#uiRegMain{
  position:relative;
  padding:20px;
  width:100%;
  height:100%;
  background-color: pink;
  border-radius:5px;
}
#uiRegText{
  width:100%;
  height:40px;
  font-size:32px;
}
#uiRegTitle{
  width:100%;
  height:70px;
  font-size:32px;
}
#uiRegInputWrap{
  width:100%;
  height:280px;
}
.uiRegLabel{
  font-size:24px;  
}
#uiRegNameWrap{
  height:80px;
}
#uiRegIconWrap{
  height:180px;
}
#uiRegIcon{
  width:128px;
  height:128px;
  background-color: white;
  cursor:pointer;
}
#uiRegCommit{
  width:160px;
  height:60px;
  font-size:32px;
  cursor:pointer;
}
#uiRegBtnWrap{
  width:100%;
  height:60px;
  display:flex;
  box-sizing:border-box;
  justify-content:center;
  align-items:center;
}
#uiRegResult{
  position:absolute;
  box-sizing:border-box;
  padding:20px;
  width:100%;
  height:100%;
  top:0px;
  left:0px;
  z-index:20;
  display:flex;
  box-sizing:border-box;
  justify-content:center;
  align-items:center;
}
#uiRegMessage{
  background-color: skyblue;
  width:200px;
  height:60px;
  vertical-align:middle;
  line-height:60px;
  text-align:center;
  font-size:24px;
}
#uiRegGenRandom{
  position:absolute;
  top:20px;
  right:20px;
  width:90px;
  height:32px;
}
.hide{
  display:none!important;
}

</style>
<div id="uiRegWrap">
  <div id="uiRegPad">
    <div id="uiRegMain">
      <button id="uiRegGenRandom">ランダム生成</button>
      <div id="uiRegTitle">ユーザー登録</div>
      <div id="uiRegInputWrap">
        <div id="uiRegNameWrap">
          <div class="uiRegLabel">なまえ（6文字まで）</div>
          <input type="text" id="uiRegText" maxlength="6">
        </div>
        <div id="uiRegIconWrap">
          <div class="uiRegLabel">アイコン</div>
          <div id="uiRegIcon"></div>
        </div>
      </div>
      <div id="uiRegBtnWrap">
        <button id="uiRegCommit">登録</button>
      </div>
    </div>
  </div>
  <div id="uiRegResult" class="hide">
    <div id="uiRegMessage">登録しました!</div>
  </div>
</div>
`;

const NG_WORDS = ["しね","ころ", "ばか","まぬけ","ちん","まん","うん","あほ"];
const HIRAGANA = "あいうえおかがきぎくぐけげこごさざしじすずせぜそぞただちぢつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもやゆよらりるれろわん";
const HIRAGANA_HEAD = HIRAGANA.replace(/ん/g, "");

class uiRegister{
  constructor(dom,socket){
    this.dom = dom;
    this.socket = socket;
    this.status = "hide";
    this.composing = false;
    this.iconSVG = null;
    this.userData = null;
  }
  async init(){
    this.dom.innerHTML = html;
    this.$wrap = this.dom.querySelector("#uiRegWrap");
    this.$main = this.dom.querySelector("#uiRegMain");
    this.$commit = this.dom.querySelector("#uiRegCommit");
    this.$result = this.dom.querySelector("#uiRegResult");
    this.$random = this.dom.querySelector("#uiRegGenRandom");
    this.$text = this.dom.querySelector("#uiRegText");
    this.$icon = this.dom.querySelector("#uiRegIcon");
    this.hide();
    this.$commit.onclick = null;
    this.$icon.onclick = (()=>{
      this.#genIcon(null);
    });
    const udjson = localStorage.getItem("userData");
    if((udjson != null)&&(udjson != 'null')){
      console.dir(udjson);
      const obj = JSON.parse(udjson);
      this.userData = obj;
      if((this.userData.name != undefined)&&(this.userData.name != null)){
        this.$text.value = this.userData.name;
      }
      if((this.userData.icon != undefined)&&(this.userData.icon != null)){
        this.avatarStr = this.userData.icon;
        this.#genIcon(this.avatarStr);
      }else{
        this.#genIcon(null);
        this.userData.icon = this.avatarStr;
      }
    }else{
      console.log("userData init");
      this.userData = {userid:null,name:null,icon:null};
      this.$text.value = "";
    }
    await this.update();
  }
  async update(){
    if(this.userData != null){
      const userdata = await this.#sendUserData(this.userData);
      this.userData = userdata;
      localStorage.setItem("userData", JSON.stringify(this.userData));
      if(this.onUpdate != null){
        const userData = this.getUserData();
        this.onUpdate(userData);
      }
    }else{
      console.log("userData is null");
    }
  }
  hide(){
    this.dom.classList.add("hide");
    this.status = "hide";
    this.$commit.onclick = null;
    this.$random.onclick = null;
    this.$text.oninput = null;
    this.$text.oncompositionstart = null;
    this.$text.oncompositionend = null;
    this.composing = false;
  }
  show(){
    this.dom.classList.remove("hide");
    if(this.$text.value.length > 0){
      this.$commit.classList.remove("hide");
    }else{
      this.$commit.classList.add("hide");
    }
    this.status = "show";
    this.$commit.onclick = (async ()=>{
      let userData = {
        userid:null,
        name:this.$text.value,
        icon:this.avatarStr
      };
      if(this.userData != null){
        userData.userid = this.userData.userid;
        this.userData.name = userData.name;
        this.userData.icon = userData.icon;
      }
      await this.update();
      this.#startMessage();
    });
    this.$random.onclick = (()=>{
      const name = this.#genRandomName();
      this.$text.value = name;
      this.#genIcon(null);
      if(this.$text.value.length > 0){
        this.$commit.classList.remove("hide");
      }else{
        this.$commit.classList.add("hide");
      }
    });
    this.$text.oncompositionstart = ((e)=>{
      this.composing = true;
    });
    this.$text.oncompositionend = ((e)=>{
      this.composing = false;
      sanitizeValue(e.target);
    });
    this.$text.oninput = ((e)=>{
      if(this.$text.value.length > 0){
        this.$commit.classList.remove("hide");
      }else{
        this.$commit.classList.add("hide");
      }
    });
    function sanitizeValue(target){
      let value = target.value;
      value = value.replace(/[^ぁ-んー]/g, "");
      value = value.replace(/^ん/, "");
      value = value.slice(0, 8);
      target.value = value;
    }
  }
  setOnUpdate(func){
    this.onUpdate = func;
  }
  resetOnUpdate(){
    this.onUpdate = null;
  }
  getUserData(){
    let userdata = structuredClone(this.userData);
    if(userdata != null){
      userdata.iconSVG = this.iconSVG;
    }
    return userdata;
  }
  async #sendUserData(userData){
    try {
      const res = await this.socket.timeout(3000).emitWithAck("register", userData);
      return res;
    } catch (err) {
      console.error("uiRegister.#sendUserData() server error = "+err);
      return null;
    }
  }
  #startMessage(){
    this.$result.classList.remove("hide");
    setTimeout(()=>{
      this.$result.classList.add("hide");
      this.hide();
    },3000);
  }
  #genRandomName(){
    while (true) {
      const length = Math.floor(Math.random() * 4) + 3;
      let name = HIRAGANA_HEAD[Math.floor(Math.random() * HIRAGANA_HEAD.length)];
      for (let i = 1; i < length; i++) {
        name += HIRAGANA[Math.floor(Math.random() * HIRAGANA.length)];
      }
      if (NG_WORDS.some(ng => name.includes(ng))) {
        continue;
      }
      return name;
    }
  }
  #genRandomString(length){
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?/`~";
    let result = "";
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      result += chars[idx];
    }
    return result;
  }
  #genIcon(_str){
    let str;
    if(_str == null){
      str = this.#genRandomString(10);
      this.avatarStr = str;
    }else{
      str = _str;
    }
    const svg = avatar(str, { size: 128, backgroundColors: ['transparent'] ,blackout:false});
    this.$icon.innerHTML = svg;
    this.iconSVG = svg;
  }
}

export default uiRegister;