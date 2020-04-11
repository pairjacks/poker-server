"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const router_1 = require("./messaging/router");
const wss = new ws_1.default.Server({
    port: 8080
});
wss.on("connection", ws => {
    ws.on("message", message => {
        if (typeof message !== "string") {
            return;
        }
        const data = JSON.parse(message);
        router_1.processMessage(ws, data);
    });
});
console.log("Poker Server Launched 🚀");
//# sourceMappingURL=index.js.map