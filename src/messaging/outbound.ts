import WebSocket from "ws";
import { Table } from "../state/state";
import { stripPrivateTableDataForSeat } from "../state/utils";
import { ServerMessage, ServerTableStateMessage } from "@pairjacks/poker-messages";

const socketDisplayNameMap: { [displayName: string]: WebSocket } = {};

export const registerWebsocket = (ws: WebSocket, displayName: string) => {
  socketDisplayNameMap[displayName] = ws;
};

export const unregisterWebsocket = (displayName: string) => {
  delete socketDisplayNameMap[displayName];
};

export const sendMessage = (ws: WebSocket, message: ServerMessage) => {
  const messageString = JSON.stringify(message);
  ws.send(messageString);
};

export const sendTableStateMessage = (table: Table) => {
  table.seats.forEach((s) => {
    if (!s.isEmpty) {
      const limitedTable = stripPrivateTableDataForSeat({
        seatToken: s.token,
        table,
      });
      const tableState: ServerTableStateMessage = {
        type: "server/table-state",
        table: limitedTable,
      };
      const socket = socketDisplayNameMap[s.token];
      if (socket) {
        sendMessage(socket, tableState);
      }
    }
  });
};
