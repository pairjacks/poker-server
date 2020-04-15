import express from "express";
import WebSocket from "ws";
import { processMessage } from "./messaging/router";
import { restJoinTable } from "./messaging/handlers/rest/restJoinTable";

const PORT = process.env.PORT || 8080;

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const server = app
  .post("/join/:tableName", restJoinTable)
  .listen(PORT, () => console.log("Listening on port:", PORT));

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
