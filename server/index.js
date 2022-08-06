import { createServer } from 'http';
import { Server } from "@colyseus/core";
import express from "express";
import { monitor } from '@colyseus/monitor';
import { Outdoor } from './room/public.js';
import { WebSocketTransport } from "@colyseus/ws-transport"


const port = process.env.PORT || 2567;
const app = express()
const server = createServer(app);

let gameServer = new Server({
  transport: new WebSocketTransport({
      server
  })
});

// register your room handlers
gameServer.define("outdoor", Outdoor, {})

app.use("/", express.static("./../client/public"));

// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor(gameServer));

gameServer.listen(port);
console.log(`Listening on port ${ port }`)
