import WebSocket from "ws";
import { getTable, saveTable } from "../../state/global";
import { sendTableStateMessage } from "../outbound";
import { startGameMutator } from "../../state/mutators";
import { ClientStartGameMessage } from "poker-messages";

export const startGame = async (
  ws: WebSocket,
  message: ClientStartGameMessage
) => {
  const table = getTable(message.tableName);
  if (!table || !table.seats.find((s) => s.token === message.seatToken)) {
    return;
  }

  const mutatedTable = startGameMutator({
    table,
    data: {},
  });

  saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
