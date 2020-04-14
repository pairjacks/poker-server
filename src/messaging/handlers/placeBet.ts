import WebSocket from "ws";
import { getTable, saveTable } from "../../state/state";
import { sendTableStateMessage } from "../outbound";
import { placeBetMutator } from "../../state/mutators";
import { ClientPlaceBetMessage } from "@pairjacks/poker-messages";

export const placeBet = async (ws: WebSocket, message: ClientPlaceBetMessage) => {
  const table = await getTable(message.tableName);

  const mutatedTable = placeBetMutator({
    table,
    data: {
      seatToken: message.seatToken,
      betChipCount: message.chipCount,
    },
  });

  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
