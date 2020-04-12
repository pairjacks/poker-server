import WebSocket from "ws";
import { getTable, saveTable } from "../../state/global";
import { sendTableStateMessage } from "../outbound";
import { foldMutator } from "../../state/mutators";
import { ClientFoldMessage } from "@pairjacks/poker-messages";

export const fold = (ws: WebSocket, message: ClientFoldMessage) => {
  const table = getTable(message.tableName);

  if (!table) {
    return;
  }

  const mutatedTable = foldMutator({
    table,
    data: {
      seatToken: message.seatToken,
    },
  });

  saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
