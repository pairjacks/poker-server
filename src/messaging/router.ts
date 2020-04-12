import WebSocket from "ws";
import { createTable } from "./handlers/createTable";
import { requestTableState } from "./handlers/requestTableState";
import { joinTable } from "./handlers/joinTable";
import { leaveTable } from "./handlers/leaveTable";
import { startGame } from "./handlers/startGame";
import { placeBet } from "./handlers/placeBet";
import { deal } from "./handlers/deal";
import { isClientMessage } from "@pairjacks/poker-messages";
import { fold } from "./handlers/fold";
import { call } from "./handlers/call";
import { check } from "./handlers/check";

export const processMessage = (ws: WebSocket, message: any) => {
  if (!isClientMessage(message)) {
    console.log("Warning: Received invalid message: ", message);
    return;
  }

  console.log("Recieved Incoming Message: ", message);

  switch (message.type) {
    case "client/create-table":
      createTable(ws, message);
      break;

    case "client/request-table-state":
      requestTableState(ws, message);
      break;

    case "client/join-table":
      joinTable(ws, message);
      break;

    case "client/leave-table":
      leaveTable(ws, message);
      break;

    case "client/start-game":
      startGame(ws, message);
      break;

    case "client/deal":
      deal(ws, message);
      break;

    case "client/place-bet":
      placeBet(ws, message);
      break;

    case "client/call":
      call(ws, message);
      break;
    
    case "client/check":
      check(ws, message);
      break;

    case "client/fold":
      fold(ws, message);
      break;
  }
};
