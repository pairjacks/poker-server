import WebSocket from "ws";
import { getTable, saveTable } from "../../state/state";
import { sendTableStateMessage } from "../outbound";
import { callMutator } from "../../state/mutators";
import { ClientCallMessage } from "@pairjacks/poker-messages";

export const call = async (ws: WebSocket, message: ClientCallMessage) => {
  const table = await getTable(message.tableName);

  const mutatedTable = callMutator({
    table,
    data: {
      seatToken: message.seatToken,
    },
  });

  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
