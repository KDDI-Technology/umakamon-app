// titleimageloader.mjs
// umakamon app taitle imageloader
// (C)2025 by KDDI Technology
// Programmed by H.Kodama (D.F.Mac.@TripArts Music)

const imageUrls = [
  "/img/nagasaki/2.png",
  "/img/nagasaki/3.png",
  "/img/nagasaki/4.png",
  "/img/nagasaki/5.png",
  "/img/nagasaki/6.png",
  "/img/nagasaki/7.png",
  "/img/nagasaki/8.png",
  "/img/nagasaki/9.png"
];

class titleImageLoader{
  constructor(dom){
    this.dom = dom;
    this.status = "unload";
    this.image = null;
    this.src = null;
  }
  load(index){
    return new Promise((resolve)=>{
      this.status = "loading";
      this.image = new Image();
      if(index == undefined){
        index = Math.floor(Math.random()*imageUrls.length);
      }
      console.log("bgImageLoader.load() index="+index);
      this.src = imageUrls[index];
      this.image.onload = (e) => {
        this.dom.style.backgroundImage = "url("+this.src+")";
        this.status = "loaded";
        resolve();
      };
      this.image.src = this.src;
    });
  }
}

export default titleImageLoader;