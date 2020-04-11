import WebSocket from "ws";
import { getTable, saveTable } from "../../state/global";
import { sendTableStateMessage } from "../outbound";
import { placeBetMutator } from "../../state/mutators";
import { ClientPlaceBetMessage } from "poker-messages";

export const placeBet = (ws: WebSocket, message: ClientPlaceBetMessage) => {
  const table = getTable(message.tableName);

  if (!table) {
    return;
  }

  const mutatedTable = placeBetMutator({
    table,
    data: {
      seatToken: message.seatToken,
      betChipCount: message.chipCount,
    },
  });

  saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
