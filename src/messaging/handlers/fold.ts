import WebSocket from "ws";
import { getTable, saveTable } from "../../state/state";
import { sendTableStateMessage } from "../outbound";
import { foldMutator } from "../../state/mutators";
import { ClientFoldMessage } from "@pairjacks/poker-messages";

export const fold = async (ws: WebSocket, message: ClientFoldMessage) => {
  const table = await getTable(message.tableName);

  const mutatedTable = foldMutator({
    table,
    data: {
      seatToken: message.seatToken,
    },
  });

  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
