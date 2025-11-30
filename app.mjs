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

function log(str){
  var dt = new Date();
  let datetime = dt.toFormat("YYYY-MM-DD HH24:MI:SS");
  console.log("["+datetime+"] "+(str));
}

try {
  await runExpressApp();
  await runWebServer();
  runSocketServer();
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

function runSocketServer(){
  io = new Server(webServer, {path:"/ws"});
  io.on("connection",(socket)=>{
    console.log("new connection : "+socket.id);

    cons[socket.id] = {id:socket.id};

    socket.on("register",(data)=>{
      log("register : "+socket.id);
      let userid = null;
      if(data.userid == null){ // new user
        // todo: create userid 
        // userid = xxxx
        io.to(socket.id).emit("newuserid",{userid:userid});
      }else{
        if(data.userid in users){
          // overwrite user data
          userid = data.userid;
        }else{
          // invalid userid
          console.log("invalid user id : "+data.userid);
        }
      }
      if(userid != null){
        clients[socket.id] = {userid:userid};
        users[userid] = {name:data.name, icon:data.icon};
        let len = Object.keys(clients).length;
        for(let key in clients){
          io.to(key).emit("clients",len);
        }
      }
    });

    socket.on("master",(data)=>{
      log("master : "+data);
      masters[socket.id] = {id:socket.id};
    });

    socket.on("push",(data)=>{
      log("push : "+data);
      if(socket.id in masters){
        console.log("push from master.");
        // ToDo score 更新処理
      }else{
        if(socket.id in clients){
          console.log("push from client.");
          // ToDo score 更新処理
          let len = Object.keys(users).length;
          for(let key in masters){
            io.to(key).emit("push",data);
          }
        }else{
          console.log("push from unregisterd user.");
        }
      }
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
