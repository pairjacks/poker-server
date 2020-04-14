import WebSocket from "ws";
import { getTable, saveTable } from "../../state/state";
import { sendTableStateMessage, sendMessage } from "../outbound";
import { removePlayerFromTableMutator } from "../../state/mutators";
import { ClientLeaveTableMessage } from "@pairjacks/poker-messages";

export const leaveTable = async (ws: WebSocket, data: ClientLeaveTableMessage) => {
  const table = await getTable(data.tableName);

  const mutatedTable = removePlayerFromTableMutator({
    table,
    data: {
      seatToken: data.seatToken
    }
  });

  await saveTable(mutatedTable);

  sendMessage(ws, {
    type: "server/table-state",
    table: undefined
  });

  sendTableStateMessage(mutatedTable);
};
