"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mutators_1 = require("../../state/mutators");
const global_1 = require("../../state/global");
const outbound_1 = require("../outbound");
const utils_1 = require("../../state/utils");
exports.createTable = (ws, data) => {
    const creatorSeatToken = generateSeatToken();
    outbound_1.registerWebsocket(ws, creatorSeatToken);
    ws.on("close", () => {
        outbound_1.unregisterWebsocket(creatorSeatToken);
    });
    const numberOfSeats = data.numberOfSeats || 2;
    const startingChipCount = data.startingChipCount || 100;
    const smallBlind = data.smallBlind || 1;
    const newTable = {
        isStarted: false,
        name: data.tableName,
        bettingRound: "pre-deal",
        splitPots: [],
        mainPotChipCount: 0,
        dealerIndex: 0,
        turnToBetIndex: 0,
        roundTerminatingSeatIndex: 0,
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
            ...Array(numberOfSeats - 1).fill(0).map(_ => ({
                token: generateSeatToken(),
                chipCount: startingChipCount,
                chipsBetCount: 0,
                pocketCards: [],
                isFolded: false,
                isBust: false,
            })),
        ]
    };
    const seatToken = creatorSeatToken;
    const table = mutators_1.addPlayerToTableMutator({
        table: newTable,
        data: {
            seatToken,
            player: {
                displayName: utils_1.randomDisplayName(),
            }
        }
    });
    global_1.saveTable(table);
    outbound_1.sendTableStateMessage(table);
};
const generateSeatToken = () => {
    return Math.random()
        .toString(36)
        .substring(2, 15);
};
//# sourceMappingURL=createTable.js.map