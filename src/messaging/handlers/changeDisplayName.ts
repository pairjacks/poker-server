import WebSocket from "ws";
import { getTable, saveTable } from "../../state/state";
import {
  sendTableStateMessage,
  registerWebsocket,
  unregisterWebsocket
} from "../outbound";
import { changeSeatDisplayNameMutator } from "../../state/mutators";
import { randomDisplayName } from "../../state/utils";
import { ClientChangeDisplayNameMessage } from "@pairjacks/poker-messages";

export const changeDisplayName = async (
  ws: WebSocket,
  data: ClientChangeDisplayNameMessage
) => {
  const table = await getTable(data.tableName);
  if (!table.seats.find(s => s.token === data.seatToken)) {
    return;
  }

  const mutatedTable = changeSeatDisplayNameMutator({
    table,
    data: {
      seatToken: data.seatToken,
      displayName: randomDisplayName(),
    }
  });

  registerWebsocket(ws, data.seatToken);
  ws.on("close", () => {
    unregisterWebsocket(data.seatToken);
  });

  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
