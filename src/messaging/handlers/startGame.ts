import WebSocket from "ws";
import { getTable, saveTable } from "../../state/state";
import { sendTableStateMessage } from "../outbound";
import { startGameMutator } from "../../state/mutators";
import { ClientStartGameMessage } from "@pairjacks/poker-messages";

export const startGame = async (
  ws: WebSocket,
  message: ClientStartGameMessage
) => {
  const table = await getTable(message.tableName);
  if (!table.seats.find((s) => s.token === message.seatToken)) {
    return;
  }

  const mutatedTable = startGameMutator({
    table,
    data: {},
  });

  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
