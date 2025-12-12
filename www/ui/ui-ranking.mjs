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
  flex-direction:column;
  color:white;
  box-sizing:border-box;
}
#uiRankHeader{
  position:relative;
  width:100%;
  height:20px;
  display:flex;
  margin-bottom:10px;
  box-sizing:border-box;
}
#uiRankBody{
  padding:10px 0px;
  width:100%;
  height:calc(100% - 20px);
  box-sizing:border-box;
}
#uiRankHeaderTitle{
  width:100%;
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
  height:30px;
  padding:5px 10px;
  background-color:rgba(0,0,128,0.5);
  align-items: center;
  box-sizing:border-box;
}
.uiRankRowTop{
  padding-top:10px!important;
}
.uiRankRowBottom{
  padding-bottom:10px!important;
}
.uiRankIcon{
  height:20px;
  width:20px;
  margin-right:5px;
}
.uiRankName{
  height:20px;
  min-width:90px;
  margin-right:5px;
  line-height:20px;
  font-size:16px;
  vertical-align:middle;
}
.uiRankScore{
  height:20px;
  min-width:60px;
  text-align:right;
}
#uiRankToggle{
  position:absolute;
  top:10px;
  right:10px;
  width:40px;
  height:40px;
  cursor:pointer;
  background-color:white;
  background-image:url(./img/ranking.png);
  background-position:center;
  background-repeat:no-repeat;
  background-size:contain;
  border-radius:5px;

}
.hide{
  display:none!important;
}
.RkShow{
  margin-top:110px;
  width:100%!important;
  height:140px!important; 
}
.uiRankRank{
  width:20px;
  text-align:center;
  margin-right:5px;
  line-height:20px;
  font-size:16px;
  vertical-align:middle;
}
#myRank{
  padding:0px 10px;
  margin:0px 5px;
  display:inline-box;
  border-radius:10px;
  text-align:center;
  background-color:pink;
  color:black;
}
</style>
<slot></slot>
<div id="uiRankWrap" class="hide">
  <div id="uiRankHeader">
    <div id="uiRankHeaderTitle">過去30分トップ3 あなたは<span id="myRank"></span>位です。</div>
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
    this.$myRank = this.$main.querySelector("#myRank");
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
    console.log("_updateView()");
    console.dir(ranking);
    const fragment = new DocumentFragment();
    this.#startUpdateTicker();
    this.$myRank.innerHTML = ranking.myRank;
    if(ranking != null){
      const rankNum = (ranking.users.length > 3)? 3 : ranking.users.length;
      for(let cnt=0;cnt<rankNum;cnt ++){
        const rank = cnt+1;
        const icon = ranking.users[cnt].icon;
        const name = ranking.users[cnt].name;
        const score = ranking.users[cnt].score;
        const $row = this.#makeRowDom(rank,icon,name,score);
        if(cnt==0){
          $row.children[0].classList.add("uiRankRowTop");
        }
        if(cnt==(rankNum-1)){
          $row.children[0].classList.add("uiRankRowBottom");
        }
        fragment.appendChild($row);
      }
      this.$body.replaceChildren(fragment);
    }
  }
  #makeRowDom(rank,icon,name,score){
    const svg = this.#genIcon(icon);
    const $row = this.#makeDomFromTemplate(htmlRow);
    const $rank = $row.querySelector(".uiRankRank");
    const $icon = $row.querySelector(".uiRankIcon");
    const $name = $row.querySelector(".uiRankName");
    const $score = $row.querySelector(".uiRankScore");
    $icon.innerHTML = svg;
    const $svg = $icon.children[0];
    $svg.style.width = "20px";
    $svg.style.height = "20px";
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
      const res = await this.socket.timeout(3000).emitWithAck("getRanking",null);
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