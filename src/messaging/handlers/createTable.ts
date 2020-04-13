import WebSocket from "ws";
import { addPlayerToTableMutator } from "../../state/mutators";
import { saveTable, Table } from "../../state/global";
import {
  sendTableStateMessage,
  registerWebsocket,
  unregisterWebsocket,
} from "../outbound";
import { randomDisplayName } from "../../state/utils";
import { ClientCreateTableMessage } from "@pairjacks/poker-messages";

export const createTable = (ws: WebSocket, data: ClientCreateTableMessage) => {
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
    name: data.tableName,
    bettingRound: "pre-deal",
    splitPots: [],
    mainPotChipCount: 0,
    maxBetChipCount: startingChipCount * numberOfSeats,
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
      player: {
        displayName: randomDisplayName(),
      },
    },
  });

  saveTable(table);
  sendTableStateMessage(table);
};

const generateSeatToken = (): string => {
  return Math.random().toString(36).substring(2, 15);
};
