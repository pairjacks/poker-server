import express from "express";
import WebSocket from "ws";
import { processMessage } from "./messaging/router";

const PORT = process.env.PORT || 8080;

const server = express().listen(PORT, () =>
  console.log("Listening on port:", PORT)
);

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    if (message === "PING") {
      console.log("Recieved PING");
      return;
    }

    if (typeof message !== "string") {
      return;
    }
    const data = JSON.parse(message);
    processMessage(ws, data);
  });
});

console.log("Poker Server Launched 🚀");
