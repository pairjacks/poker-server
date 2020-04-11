import WebSocket from "ws";
import { getTable, saveTable } from "../../state/global";
import { sendTableStateMessage } from "../outbound";
import { dealMutator } from "../../state/mutators";
import { ClientDealMessage } from "poker-messages";
import { shuffleDeckNaive, createDeck } from "@kavsingh/poker-cards";

export const deal = async (ws: WebSocket, message: ClientDealMessage) => {
  const table = getTable(message.tableName);
  if (!table) {
    return;
  }

  const deck = await shuffleDeckNaive(createDeck());

  const mutatedTable = dealMutator({
    table,
    data: { seatToken: message.seatToken, deck },
  });

  saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
