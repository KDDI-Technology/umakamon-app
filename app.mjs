// app.mjs
// kuso-app hosting server
// simple version
// 2023-2025 by D.F.Mac.@TripArts Music

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

let cons = {};
let users = {};

function runSocketServer(){
  io = new Server(webServer, {path:"/ws"});
  io.on("connection",(socket)=>{
    console.log("new connection : "+socket.id);
    cons[socket.id] = {id:socket.id};
    socket.on("client",(data)=>{
      log("client : "+socket.id);
      users[socket.id] = {id:socket.id};
      let len = Object.keys(users).length;
      for(let key in users){
        io.to(key).emit("users",len);
      }
    });
    socket.on("push",(data)=>{
      log("push : "+data);
      let len = Object.keys(users).length;
      for(let key in users){
        if(key != socket.id){
          io.to(key).emit("push",data);
        }
      }
    })
    socket.on("disconnect",(data)=>{
      log("disconnected : "+socket.id);
      let user = cons[socket.id].user;
      delete cons[socket.id];
      if(socket.id in users){
        delete users[socket.id];
        let len = Object.keys(users).length;
        for(let key in users){
          io.to(key).emit("users",len);
        }
      }
    });
  });
}
