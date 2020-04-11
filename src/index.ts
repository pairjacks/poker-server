import WebSocket from "ws";
import { processMessage } from "./messaging/router";

const wss = new WebSocket.Server({
  port: 8080
});

wss.on("connection", ws => {
  ws.on("message", message => {
    if (typeof message !== "string") {
      return;
    }
    const data = JSON.parse(message);
    processMessage(ws, data);
  });
});

console.log("Poker Server Launched 🚀");
