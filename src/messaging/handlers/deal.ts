import WebSocket from "ws";
import { shuffleDeckNaive, createDeck } from "@pairjacks/poker-cards";
import { getTable, saveTable } from "../../state/state";
import { sendTableStateMessage } from "../outbound";
import { dealMutator } from "../../state/mutators";
import { ClientDealMessage } from "@pairjacks/poker-messages";

export const deal = async (ws: WebSocket, message: ClientDealMessage) => {
  const table = await getTable(message.tableName);

  const deck = await shuffleDeckNaive(createDeck());

  const mutatedTable = dealMutator({
    table,
    data: { seatToken: message.seatToken, deck },
  });

  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable);
};
