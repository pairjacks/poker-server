import WebSocket from "ws";
import { getTable, saveTable } from "../../state/state";
import { sendTableStateMessage } from "../outbound";
import {  checkMutator } from "../../state/mutators";
import { ClientCheckMessage } from "@pairjacks/poker-messages";

export const check = async (ws: WebSocket, message: ClientCheckMessage) => {
  const table = await getTable(message.tableName);

  const mutatedTable = checkMutator({
    table,
    data: {
      seatToken: message.seatToken,
    },
  });

  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
