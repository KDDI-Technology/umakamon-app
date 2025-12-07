// ui-ranking.mjs
// umakamon app user ranking UI
// (C)2025 by KDDI Technology
// Programmed by H.Kodama (D.F.Mac.@TripArts Music)

import avatar from "../libs/animal-avatar-generator.esm.js";

const html = `
<style>
#uiRankWrap{
  position:absolute;
  right:0px;
  top:0px;
  width:60px;
  height:60px;
  padding:10px;
  display:flex;
  color:white;
  box-sizing:border-box;
}
#uiRankHeader{
  position:relative;
  width:100%;
  height:20px;
  display:flex;
}
#uiRankBody{
  width:100%;
  height:calc(100% - 20px);
}
#uiRankHeaderTitle{
  width:140px;
}
#uiRankUpdateTicker{
  position:absolute;
  top:0px;
  right:10px;
  width:100px;
  hheight:20px;
  vertical-align:middle;
  line-height:20px;
  text-align:center;
  color:red;
  background-color:yellow;
  border-radius:10px;
}
.uiRankRowWrap{
  display:flex;
  width:100%;
  height:25px;
  padding-bottom:5px;
  background-color:rgba(0,0,128,0.5);
}
.uiRankIcon{
  height:20px;
  width:20px;
}
.uiRankName{
  height:20px;
  width:20px;
}
.uiRankScore{
  height:20px;
  min-width:20px;
}
#uiRankToggle{
  position:absolute;
  top:10px;
  right:10px;
  width:40px;
  height:40px;
  cursor:pointer;
  background-color:green;
  border-radius:5px;
}
.hide{
  display:none!important;
}
.RkShow{
  margin-top:110px;
  width:100%!important;
  height:100%!important; 
}
</style>
<slot></slot>
<div id="uiRankWrap" class="hide">
  <div id="uiRankHeader">
    <div id="uiRankHeaderTitle">過去30分トップ3</div>
    <div id="uiRankUpdateTicker" class="hide">Update!</div>
  </div>
  <div id="uiRankBody"></div>
</div>
<div id="uiRankToggle"></div>
`;

const htmlRow = `
  <div class="uiRankRowWrap">
    <div class="uiRankRank"></div>
    <div class="uiRankIcon"></div>
    <div class="uiRankName"></div>
    <div class="uiRankScore"></div>
  </div>
`;

const TICKER_TIME = 1000; // update ticker timer 

class uiRanking{
  constructor(dom,socket){
    this.dom = dom;
    this.shadow = this.dom.attachShadow({ mode: "open" });
    this.socket = socket;
    this.status = "hide";
    this.updateTimer = null;
    this.template = null;
  }
  async init(){
    this.shadow.appendChild(this.#makeDomFromTemplate(html));
    this.$main = this.shadow.querySelector("#uiRankWrap");
    this.$header = this.$main.querySelector("#uiRankHeader");
    this.$body = this.$main.querySelector("#uiRankBody");
    this.$ticker = this.$main.querySelector("#uiRankUpdateTicker");
    this.$toggle = this.shadow.querySelector("#uiRankToggle");
    this.$toggle.onclick = () => {
      if(this.status == "hide"){
        this.show();
      }else{
        this.hide();
      }
    };
    this.socket.on("rankingUpdate",(data)=>{
      this._updateView(data);
    });
    await this.#updateRanking();
  }
  hide(){
    this.$main.classList.add("hide");
    this.$main.classList.remove("RkShow");
    this.status = "hide";
  }
  show(){
    this.$main.classList.remove("hide");
    this.$main.classList.add("RkShow");
    this.status = "show";
  }
  async #updateRanking(){
    const ranking = await this.#getRanking();
    this._updateView(ranking);
  }
  _updateView(ranking){
    const fragment = new DocumentFragment();
    this.#startUpdateTicker();
    if(ranking != null){
      const rankNum = (ranking.users.length > 3)? 3 : ranking.users.length;
      for(let cnt=0;cnt<rankNum;cnt ++){
        const rank = cnt+1;
        const icon = ranking.users[cnt].icon;
        const name = ranking.users[cnt].name;
        const score = ranking.users[cnt].score;
        const $row = this.#makeRowDom(icon,rank,name,score);
        fragment.appendChild($row);
      }
      this.$body.replaceChildren(fragment);
    }
  }
  #makeRowDom(rank,iconStr,name,score){
    const svg = this.#genIcon(iconStr);
    const $row = this.#makeDomFromTemplate(htmlRow);
    const $rank = $row.querySelector(".uiRankRank");
    const $icon = $row.querySelector(".uiRankIcon");
    const $name = $row.querySelector(".uiRankName");
    const $score = $row.querySelector(".uiRankScore");
    $icon.innerHTML = svg;
    $icon.style.width = "20px";
    $icon.style.height = "20px";
    $rank.innerHTML = rank;
    $name.innerHTML = name;
    $score.innerHTML = score;
    return $row;
  }
  #makeDomFromTemplate(template) {
    const t = document.createElement('template');
    t.innerHTML = template.trim();
    return t.content.cloneNode(true);
  }
  async #getRanking(){
    try {
      const res = await this.socket.timeout(3000).emitWithAck("getRanking");
      return res;
    } catch (err) {
      console.error("uiRanking.#getRanking() server error = "+err);
      return null;
    }
  }
  #genIcon(str){
    const svg = avatar(str, { size: 128, backgroundColors: ['transparent'] ,blackout:false});
    return svg;
  }
  #startUpdateTicker(){
    this.$ticker.classList.remove("hide");
    if(this.updateTimer != null){
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    this.updateTimer = setTimeout(()=>{
      this.$ticker.classList.add("hide");
    },TICKER_TIME);
  }
}

export default uiRanking;