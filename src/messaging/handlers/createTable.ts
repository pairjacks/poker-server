import WebSocket from "ws";
import { addPlayerToTableMutator } from "../../state/mutators";
import { saveTable, Table } from "../../state/state";
import {
  sendTableStateMessage,
  registerWebsocket,
  unregisterWebsocket,
} from "../outbound";
import { randomDisplayName } from "../../state/utils";
import { ClientCreateTableMessage } from "@pairjacks/poker-messages";

export const createTable = async (
  ws: WebSocket,
  data: ClientCreateTableMessage
) => {
  const creatorSeatToken = generateSeatToken();
  registerWebsocket(ws, creatorSeatToken);
  ws.on("close", () => {
    unregisterWebsocket(creatorSeatToken);
  });

  const numberOfSeats = data.numberOfSeats || 2;
  const startingChipCount = data.startingChipCount || 100;
  const smallBlind = data.smallBlind || 1;

  const newTable: Table = {
    isStarted: false,
    name: encodeURIComponent(data.tableName),
    bettingRound: "pre-deal",
    activePot: { seatTokens: [], chipCount: 0 },
    splitPots: [],
    maxBetChipCount: startingChipCount * numberOfSeats,
    highlightRelevantCards: data.highlightRelevantCards,
    dealerIndex: 0,
    turnToBetIndex: 0,
    roundTerminatingSeatIndex: 0,
    revealPocketIndeces: [],
    smallBlind: smallBlind,
    deck: [],
    communityCards: [],
    seats: [
      {
        token: creatorSeatToken,
        chipCount: startingChipCount,
        chipsBetCount: 0,
        pocketCards: [],
        displayName: randomDisplayName(),
        isEmpty: false,
        isFolded: false,
        isBust: false,
      },
      ...Array(numberOfSeats - 1)
        .fill(0)
        .map((_) => ({
          token: generateSeatToken(),
          chipCount: startingChipCount,
          chipsBetCount: 0,
          pocketCards: [],
          displayName: randomDisplayName(),
          isEmpty: true,
          isFolded: false,
          isBust: false,
        })),
    ],
  };

  const seatToken = creatorSeatToken;
  const table = addPlayerToTableMutator({
    table: newTable,
    data: {
      seatToken,
    },
  });

  await saveTable(table);
  sendTableStateMessage(table);
};

const generateSeatToken = (): string => {
  return Math.random().toString(36).substring(2, 15);
};
