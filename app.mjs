// app.mjs
// umakamon app hosting server
// (C)2025 by KDDI Technology
// Programmed by H.Kodama (D.F.Mac.@TripArts Music)

import fs from 'fs';
import http from 'http';
import express from 'express';
import cors from 'cors';　
import path from 'path';
import auth from 'basic-auth';
import { Server } from "socket.io";
import dt from 'date-utils';

const fsp = fs.promises;
const dirname = path.dirname(new URL(import.meta.url).pathname);
const LISTEN_IP = "127.0.0.1";
const LISTEN_PORT = 3179;

let webServer;
let io;
let app;
let interval;
let prevSeconds = -1;
let prevDiv = -1;
const DIV_NUM = 6;

function log(str){
  var dt = new Date();
  let datetime = dt.toFormat("YYYY-MM-DD HH24:MI:SS");
  console.log("["+datetime+"] "+(str));
}

try {
  await runExpressApp();
  await runWebServer();
  runSocketServer();
  startAggregateInterval();
} catch (err) {
  console.error(err);
}

async function runExpressApp() {
  app = express();
  app.use(express.urlencoded({ extended: true , limit: '10mb'}));
  app.use(express.json({ extended: true , limit: '10mb'}));
  app.use(cors());
  app.use('/',express.static('./www'));
}

async function runWebServer() {
  webServer = http.createServer(app);
  webServer.on('error', (err) => {
    console.error('starting web server failed:', err.message);
  });

  await new Promise((resolve) => {
    webServer.listen(LISTEN_PORT, () => {
      console.log('server is running PORT:'+LISTEN_PORT);
      resolve();
    });
  });
}

let cons = {};      // connectionの一覧を管理するMAP  key = socket.id
let clients = {};   // clientの一覧を管理するMAP      key = socket.id
let masters = {};   // masterの一覧を管理するMAP      key = socket.id
let users = {};     // userの一覧を管理するMAP        key = userid

let snapshots = [];    // userランキングの集計用 (30分リングバッファ)
let minuteDeltas = {};  // 1分間のscore増加分蓄積用
let masterRanking = [];  // masterスコアの集計用 (実質masterは1つなのでどっちかというと履歴用)

function runSocketServer(){
  io = new Server(webServer, {path:"/ws"});
  io.on("connection",(socket)=>{
    console.log("new connection : "+socket.id);

    cons[socket.id] = {id:socket.id};

    socket.on("register",(data,callback)=>{
      console.log("register=");
      console.dir(data);
      log("register : "+socket.id);
      let userid = null;
      if(data.userid == null){ // new user
        userid = genUserId();
      }else{
        if(data.userid in users){
          // overwrite user data
          userid = data.userid;
        }else{
          console.log("invalid user id : "+data.userid);
          userid = genUserId();
        }
      }
      clients[socket.id] = {userid:userid};
      if(!(userid in users)){
        users[userid] = {};
      }
      if(data.name != null){
        users[userid].name = data.name;
      }
      if(data.icon != null){
        users[userid].icon = data.icon;
      }
      if(users[userid].score == undefined || users[userid].score == null){
        users[userid].score = 0;
      }
      callback({
        ok:true,
        userid:userid,
        name:users[userid].name,
        icon:users[userid].icon,
        score:users[userid].score
      });
      let len = Object.keys(clients).length;
      for(let key in clients){
        io.to(key).emit("clients",len);
      }
    });

    socket.on("master",(data)=>{
      log("master : "+data);
      masters[socket.id] = {id:socket.id};
    });

    socket.on("push",(data,callback)=>{
      log("push : "+data);
      let score = null;
      if(socket.id in masters){
        console.log("push from master.");
        // ToDo score 更新処理
      }else{
        if(socket.id in clients){
          let userid = clients[socket.id].userid;
          console.log("push from client. userid="+userid);
          let delta = getScore(Number(data));
          users[userid].score = users[userid].score + delta
          minuteDeltas[userid] = (minuteDeltas[userid] || 0) + delta;
          score = users[userid].score;
          for(let key in masters){
            io.to(key).emit("push",data);
          }
        }else{
          console.log("push from unregisterd user.");
        }
      }
      console.log("score="+score);
      callback({ok:true,score:score});
    });

    socket.on("getRanking",(data,callback)=>{
      const userid = clients[socket.id].userid;
      const { ranking, position } = getRankingAndPosition(userid);
      const top3 = ranking.slice(0, 3);
      const payload = {
        users:top3,
        myRank: position
      };
      callback(payload);
    });

    socket.on("disconnect",(data)=>{
      log("disconnected : "+socket.id);
      let user = cons[socket.id].user;
      delete cons[socket.id];
      if(socket.id in clients){
        delete clients[socket.id];
        let len = Object.keys(clients).length;
        for(let key in clients){
          io.to(key).emit("clients",len);
        }
      }
      if(socket.id in masters){
        delete masters[socket.id];
      }
    });
  });
}

function genUserId(){
  while(true){
    let id = generateId(8);
    if(id in users){
      continue;
    }
    return(id);
  }
}

function generateId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&_.";

  let result = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    result += chars[idx];
  }
  return result;
}

function getScore(num){
  let score = 0;
  switch(num){
  case 0:
  case 1:
  case 2:
  case 3:
  case 4:
  case 5:
  case 6:
  case 7:
    score = 5+Math.floor(Math.random()*5);
    break;
  }
  return score;
}

function startAggregateInterval(){
  interval = setInterval((e)=>{
    const now = new Date();
    const seconds = now.getSeconds();
    console.log("interval sec="+seconds);
//    if(prevSeconds > seconds){
//      console.log("update ranking");
//      calcScore();
//      broadcast30minRanking();
//    }
    const div = seconds % DIV_NUM;
    if(prevDiv > div){
      console.log("update ranking");
      calcScore();
      broadcast30minRanking();
    }
    prevDiv = div;
    prevSeconds = seconds;
  },1000);
}

function get30minRanking() {
  const recent = snapshots.slice(-300);
  let totals = {};

  for (const snap of recent) {
    for (const [userid, delta] of Object.entries(snap.deltas)) {
      totals[userid] = (totals[userid] || 0) + delta;
    }
  }
  return totals;
}

function calcScore() {
  const snap = {
    timestamp: Date.now(),
    deltas: { ...minuteDeltas }
  };
  snapshots.push(snap);
  if (snapshots.length > 300) snapshots.shift();
  minuteDeltas = {};
}

function getRankingAndPosition(_userid) {
  const totals = get30minRanking();
  let ranking = Object.entries(totals).map(([userid, score]) => ({
    userid,
    score,
    name: users[userid]?.name ?? "",
    icon: users[userid]?.icon ?? ""
  }));
  ranking.sort((a, b) => b.score - a.score);
  const position = ranking.findIndex(r => r.userid === _userid);
  return {
    ranking,            // 全ランキング
    position: position >= 0 ? position + 1 : null  // 見つかったら順位、いなければ null
  };
}

function broadcast30minRanking() {
  for (const socketid in clients) {
    const userid = clients[socketid].userid;
    const { ranking, position } = getRankingAndPosition(userid);
    const top3 = ranking.slice(0, 3);
    const payload = {
      users:top3,
      myRank: position
    };
    io.to(socketid).emit("rankingUpdate",payload);
  }
}
