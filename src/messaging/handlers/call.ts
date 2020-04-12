import WebSocket from "ws";
import { getTable, saveTable } from "../../state/global";
import { sendTableStateMessage } from "../outbound";
import { callMutator } from "../../state/mutators";
import { ClientCallMessage } from "@pairjacks/poker-messages";

export const call = (ws: WebSocket, message: ClientCallMessage) => {
  const table = getTable(message.tableName);

  if (!table) {
    return;
  }

  const mutatedTable = callMutator({
    table,
    data: {
      seatToken: message.seatToken,
    },
  });

  saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
