import WebSocket from "ws";
import { getTable, saveTable } from "../../state/global";
import { sendTableStateMessage, sendMessage } from "../outbound";
import { removePlayerFromTableMutator } from "../../state/mutators";
import { ClientLeaveTableMessage } from "@pairjacks/poker-messages";

export const leaveTable = (ws: WebSocket, data: ClientLeaveTableMessage) => {
  const table = getTable(data.tableName);
  if (!table) {
    return;
  }

  const mutatedTable = removePlayerFromTableMutator({
    table,
    data: {
      seatToken: data.seatToken
    }
  });

  saveTable(mutatedTable);

  sendMessage(ws, {
    type: "table-state",
    table: undefined
  });

  sendTableStateMessage(mutatedTable);
};
