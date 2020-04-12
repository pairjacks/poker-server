import WebSocket from "ws";
import { shuffleDeckNaive, createDeck } from "@pairjacks/poker-cards";
import { getTable, saveTable } from "../../state/global";
import { sendTableStateMessage } from "../outbound";
import { dealMutator } from "../../state/mutators";
import { ClientDealMessage } from "poker-messages";

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
