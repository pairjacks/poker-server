import WebSocket from "ws";
import { getTable, saveTable } from "../../state/global";
import { sendTableStateMessage } from "../outbound";
import {  checkMutator } from "../../state/mutators";
import { ClientCheckMessage } from "@pairjacks/poker-messages";

export const check = (ws: WebSocket, message: ClientCheckMessage) => {
  const table = getTable(message.tableName);

  if (!table) {
    return;
  }

  const mutatedTable = checkMutator({
    table,
    data: {
      seatToken: message.seatToken,
    },
  });

  saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
