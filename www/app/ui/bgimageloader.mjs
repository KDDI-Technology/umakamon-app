// bgimageloader.mjs
// umakamon app bg imageloader
// (C)2025 by KDDI Technology
// Programmed by H.Kodama (D.F.Mac.@TripArts Music)

const imageUrls = [
  "/img/bg/1.jpg",
  "/img/bg/2.jpg",
  "/img/bg/3.jpg",
  "/img/bg/4.jpg",
  "/img/bg/5.jpg",
  "/img/bg/6.jpg",
  "/img/bg/7.jpg",
  "/img/bg/8.jpg",
  "/img/bg/9.jpg",
  "/img/bg/10.jpg",
  "/img/bg/11.jpg",
  "/img/bg/12.jpg",
  "/img/bg/13.jpg",
  "/img/bg/14.jpg",
  "/img/bg/15.jpg",
  "/img/bg/16.jpg",
  "/img/bg/17.jpg",
  "/img/bg/18.jpg",
  "/img/bg/19.jpg",
  "/img/bg/20.jpg"
];

class bgImageLoader{
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

export default bgImageLoader;