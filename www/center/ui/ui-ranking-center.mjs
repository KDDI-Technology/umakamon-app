// ui-ranking-center.mjs
// umakamon app user ranking UI for center app
// (C)2025 by KDDI Technology
// Programmed by H.Kodama (D.F.Mac.@TripArts Music)

import avatar from "/libs/animal-avatar-generator.esm.js";

const html = `
<style>
#uiRankWrap{
  position:absolute;
  right:0px;
  bottom:10px;
  width:60px;
  padding:10px;
  display:flex;
  flex-direction:column;
  justify-content:flex-start;
  color:white;
  box-sizing:border-box;
}
#uiRankCenterWrap{
  position:absolute;
  right:0px;
  top:100px;
  width:60px;
  padding:10px;
  display:flex;
  flex-direction:column;
  justify-content:flex-start;
  color:white;
  box-sizing:border-box;
}
.uiRankHeader{
  width:100%;
  height:40px;
  display:flex;
  line-height:40px;
  padding:0px 10px;
  vertical-align:middle;
  box-sizing:border-box;
  border-radius:20px 20px 0px 0px;
  background-color:rgba(0,0,0,0.5);
}
.uiRankBottom{
  width:100%;
  height:20px;
  line-height:40px;
  vertical-align:middle;
  padding:0px 10px;
  display:flex;
  box-sizing:border-box;
  border-radius:0px 0px 20px 20px;
  background-color:rgba(0,0,0,0.5);
}
.uiRankBody{
  padding:0px 0px;
  width:100%;
  box-sizing:border-box;
}
#uiRankHeaderTitle{
  width:100%;
}
#uiRankUpdateTicker{
  position:absolute;
  top:20px;
  right:20px;
  width:20px;
  height:20px;
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
  width:160px;
  margin-right:5px;
  line-height:20px;
  font-size:16px;
  vertical-align:middle;
}
.uiRankTime{
  height:20px;
  width:180px;
  margin-right:5px;
  line-height:20px;
  font-size:16px;
  vertical-align:middle;
}
.uiRankScore{
  height:20px;
  width:100px;
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
  background-image:url(/img/ranking.png);
  background-position:center;
  background-repeat:no-repeat;
  background-size:contain;
  border-radius:5px;
}
.hide{
  display:none!important;
}
.RkShow{
  width:320px!important;
  min-height:80px!important; 
}
.uiRankRank{
  width:20px;
  height:20px;
  text-align:center;
  margin-right:5px;
  line-height:20px;
  font-size:16px;
  vertical-align:middle;
}
#myRank{
  padding:0px 10px;
  height:20px;
  margin:10px;
  line-height:20px;
  vertical-align:middle;
  display:inline-box;
  border-radius:10px;
  text-align:center;
  background-color:pink;
  color:black;
}
</style>
<slot></slot>
<div id="uiRankCenterWrap" class="hide">
  <div class="uiRankHeader">
    <div id="uiRankCenterHeaderTitle">得点トップ10</div>
    <div id="uiRankCenterUpdateTicker" class="hide"></div>
  </div>
  <div class="uiRankBody"></div>
  <div class="uiRankBottom"></div>
</div>
<div id="uiRankWrap" class="hide">
  <div class="uiRankHeader">
    <div id="uiRankHeaderTitle">ゲスト過去30分トップ3</div>
    <div id="uiRankUpdateTicker" class="hide"></div>
  </div>
  <div class="uiRankBody"></div>
  <div class="uiRankBottom"></div>
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

const centerRow = `
  <div class="uiRankRowWrap">
    <div class="uiRankRank"></div>
    <div class="uiRankTime"></div>
    <div class="uiRankScore"></div>
  </div>
`;

const TICKER_TIME = 1000; // update ticker timer 

class uiRankingCenter{
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
    this.$body = this.$main.querySelector(".uiRankBody");
    this.$ticker = this.$main.querySelector("#uiRankUpdateTicker");
    this.$toggle = this.shadow.querySelector("#uiRankToggle");
    this.$cMain = this.shadow.querySelector("#uiRankCenterWrap");
    this.$cBody = this.$cMain.querySelector(".uiRankBody");
    this.$cTicker = this.$cMain.querySelector("#uiRankCenterUpdateTicker");

    this.$toggle.onclick = () => {
      if(this.status == "hide"){
        this.show();
      }else{
        this.hide();
      }
    };
    this.socket.on("rankingUpdate",(data)=>{
      this.#updateView(data);
    });
    await this.#updateRanking();
    await this.#updateCenterScores();
  }
  click(){
    this.$toggle.click();
  }
  hide(){
    this.$main.classList.add("hide");
    this.$cMain.classList.add("hide");
    this.$main.classList.remove("RkShow");
    this.$cMain.classList.remove("RkShow");
    this.status = "hide";
  }
  show(){
    this.$main.classList.remove("hide");
    this.$cMain.classList.remove("hide");
    this.$main.classList.add("RkShow");
    this.$cMain.classList.add("RkShow");
    this.status = "show";
  }
  updateCenterScores(scores){
    this.#updateCenterView(scores);
  }
  async #updateRanking(){
    const ranking = await this.#getRanking();
    this.#updateView(ranking);
  }
  async #updateCenterScores(){
    const scores = await this.#getCenterScores();
    this.#updateCenterView(scores);
  }
  #updateView(ranking){
//    console.log("_updateView()");
//    console.dir(ranking);
    const fragment = new DocumentFragment();
    this.#startUpdateTicker("guest");
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
  #updateCenterView(scores){
    console.log("#updateCenterView()");
    console.dir(scores);
    const fragment = new DocumentFragment();
    this.#startUpdateTicker("center");
    if(scores != null){
      const num = (scores.length > 10)? 10 : scores.length;
      for(let cnt=0;cnt<num;cnt ++){
        const rank = cnt+1;
        const time = scores[cnt].time;
        const score = scores[cnt].score;
        const $row = this.#makeCenterRowDom(rank,time,score);
        if(cnt==0){
          $row.children[0].classList.add("uiRankRowTop");
        }
        if(cnt==(num-1)){
          $row.children[0].classList.add("uiRankRowBottom");
        }
        fragment.appendChild($row);
      }
      this.$cBody.replaceChildren(fragment);
    }
  }
  #makeCenterRowDom(rank,time,score){
    const $row = this.#makeDomFromTemplate(centerRow);
    const $rank = $row.querySelector(".uiRankRank");
    const $time = $row.querySelector(".uiRankTime");
    const $score = $row.querySelector(".uiRankScore");
    $rank.innerHTML = rank;
    $time.innerHTML = this.#formatDate(time);
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
      const res = await this.socket.timeout(3000).emitWithAck("getRankingFromMaster",null);
      return res;
    } catch (err) {
      console.error("uiRanking.#getRanking() server error = "+err);
      return null;
    }
  }
  async #getCenterScores(){
    try {
      const res = await this.socket.timeout(3000).emitWithAck("getCenterScores",null);
      return res;
    } catch (err) {
      console.error("uiRanking.#getCenterScores() server error = "+err);
      return null;
    }
  }

  #genIcon(str){
    const svg = avatar(str, { size: 128, backgroundColors: ['transparent'] ,blackout:false});
    return svg;
  }
  #startUpdateTicker(type){
    let $dom = (type == "guest")? this.$ticker : this.$cTicker;
    $dom.classList.remove("hide");
    if(this.updateTimer != null){
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    this.updateTimer = setTimeout(()=>{
      $dom.classList.add("hide");
    },TICKER_TIME);
  }
  #formatDate(ms){
    const d = new Date(ms);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    const hh   = String(d.getHours()).padStart(2, '0');
    const min  = String(d.getMinutes()).padStart(2, '0');
    const ss   = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${min}:${ss}`;
  }
}

export default uiRankingCenter;