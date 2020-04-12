import WebSocket from "ws";
import { getTable, saveTable } from "../../state/global";
import {
  sendTableStateMessage,
  sendMessage,
  registerWebsocket,
  unregisterWebsocket
} from "../outbound";
import { addPlayerToTableMutator } from "../../state/mutators";
import { randomDisplayName } from "../../state/utils";
import { ClientJoinTableMessage } from "@pairjacks/poker-messages";

export const joinTable = (
  ws: WebSocket,
  data: ClientJoinTableMessage
) => {
  const table = getTable(data.tableName);
  if (!table || !table.seats.find(s => s.token === data.seatToken)) {
    return;
  }

  const mutatedTable = addPlayerToTableMutator({
    table,
    data: {
      seatToken: data.seatToken,
      player: {
        displayName: randomDisplayName(),
      }
    }
  });

  registerWebsocket(ws, data.seatToken);
  ws.on("close", () => {
    unregisterWebsocket(data.seatToken);
  });

  saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
