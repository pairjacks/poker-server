import WebSocket from "ws";
import { getTable, saveTable } from "../../state/state";
import {
  sendTableStateMessage,
  registerWebsocket,
  unregisterWebsocket
} from "../outbound";
import { addPlayerToTableMutator } from "../../state/mutators";
import { randomDisplayName } from "../../state/utils";
import { ClientJoinTableMessage } from "@pairjacks/poker-messages";

export const joinTable = async (
  ws: WebSocket,
  data: ClientJoinTableMessage
) => {
  const table = await getTable(data.tableName);
  if (!table.seats.find(s => s.token === data.seatToken)) {
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

  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
