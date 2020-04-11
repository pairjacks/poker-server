"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const poker_cards_1 = require("@kavsingh/poker-cards");
const utils_1 = require("./utils");
exports.addPlayerToTableMutator = ({ table, data, }) => {
    return Object.assign(Object.assign({}, table), { seats: table.seats.map((s) => {
            if (s.token === data.seatToken) {
                return Object.assign(Object.assign({}, s), { player: data.player });
            }
            return s;
        }) });
};
exports.removePlayerFromTableMutator = ({ table, data, }) => {
    return Object.assign(Object.assign({}, table), { seats: table.seats.map((s) => {
            if (s.token === data.seatToken) {
                return Object.assign(Object.assign({}, s), { player: undefined });
            }
            return s;
        }) });
};
exports.startGameMutator = ({ table, }) => {
    return Object.assign(Object.assign({}, table), { isStarted: true });
};
exports.dealMutator = ({ table, data, }) => {
    if (table.bettingRound !== "pre-deal") {
        return table;
    }
    const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
    if (seatIndex === -1 || seatIndex !== table.dealerIndex) {
        return table;
    }
    const smallBlindIndex = table.seats.length === 2
        ? table.dealerIndex
        : utils_1.indexOfFirstNonBustSeatToLeftOfIndex(table, table.dealerIndex);
    const smallBlindsTurnTable = Object.assign(Object.assign({}, table), { turnToBetIndex: smallBlindIndex });
    const smallBlindSeatToken = table.seats[smallBlindIndex].token;
    const smallBlindBetTable = exports.placeBetMutator({
        table: smallBlindsTurnTable,
        data: {
            seatToken: smallBlindSeatToken,
            betChipCount: table.smallBlind,
        },
    });
    const bigBlindIndex = utils_1.indexOfFirstNonBustSeatToLeftOfIndex(table, smallBlindIndex);
    const bigBlindSeatToken = table.seats[bigBlindIndex].token;
    const bigBlindBetTable = exports.placeBetMutator({
        table: smallBlindBetTable,
        data: {
            seatToken: bigBlindSeatToken,
            betChipCount: table.smallBlind * 2,
        },
    });
    // First turn is left of big blind except in head up poker when it's the dealer.
    const firstTurnIndex = table.seats.length === 2
        ? table.dealerIndex
        : utils_1.indexOfFirstNonBustSeatToLeftOfIndex(bigBlindBetTable, bigBlindIndex);
    // Assign pocket cards to seats. Use a reduce to encapsulate return type
    // of draw cards function
    const withPockets = bigBlindBetTable.seats.reduce((acc, seat) => {
        const { cards, deck } = poker_cards_1.drawCardsFromDeck(acc.deck, 2);
        return {
            deck,
            seats: acc.seats.concat(Object.assign(Object.assign({}, seat), { pocketCards: seat.isBust ? [] : cards })),
        };
    }, { seats: [], deck: data.deck });
    return Object.assign(Object.assign({}, bigBlindBetTable), { bettingRound: "pre-flop", seats: withPockets.seats.map((s) => (Object.assign(Object.assign({}, s), { isFolded: s.isBust }))), deck: withPockets.deck, communityCards: [], turnToBetIndex: firstTurnIndex, roundTerminatingSeatIndex: bigBlindIndex });
};
exports.placeBetMutator = ({ table, data, }) => {
    const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
    if (seatIndex === -1 || seatIndex !== table.turnToBetIndex) {
        return table;
    }
    const seat = table.seats[seatIndex];
    if (seat.chipCount < data.betChipCount) {
        return table;
    }
    const minimumChipsToPlay = utils_1.findHighestBetAtTable(table);
    if (seat.chipsBetCount + data.betChipCount < minimumChipsToPlay &&
        seat.chipCount !== data.betChipCount) {
        // They didn't bet enough and this is not an all in.
        return table;
    }
    const nextSeatTurnIndex = utils_1.indexOfFirstNonFoldedSeatLeftOfSeatIndex(table, seatIndex);
    return Object.assign(Object.assign({}, table), { turnToBetIndex: nextSeatTurnIndex, roundTerminatingSeatIndex: utils_1.indexOfFirstNonFoldedSeatRightOfSeatIndex(table, seatIndex), seats: table.seats.map((s) => {
            return s.token === data.seatToken
                ? Object.assign(Object.assign({}, s), { chipCount: s.chipCount - data.betChipCount, chipsBetCount: s.chipsBetCount + data.betChipCount }) : s;
        }) });
};
exports.callMutator = ({ table, data, }) => {
    const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
    if (seatIndex === -1 || seatIndex !== table.turnToBetIndex) {
        return table;
    }
    const seat = table.seats[seatIndex];
    const costToPlay = utils_1.findHighestBetAtTable(table);
    const chipsToPay = costToPlay - seat.chipsBetCount;
    return endTurnMutator({
        table: Object.assign(Object.assign({}, table), { seats: table.seats.map((s) => {
                return s.token === data.seatToken
                    ? Object.assign(Object.assign({}, s), { chipCount: s.chipCount - chipsToPay, chipsBetCount: s.chipsBetCount + chipsToPay }) : s;
            }) }),
        data: { seatIndex },
    });
};
exports.checkMutator = ({ table, data, }) => {
    const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
    if (seatIndex === -1 || seatIndex !== table.turnToBetIndex) {
        return table;
    }
    const seat = table.seats[seatIndex];
    const currentHighestBet = utils_1.findHighestBetAtTable(table);
    if (seat.chipsBetCount < currentHighestBet) {
        return table;
    }
    return endTurnMutator({ table, data: { seatIndex } });
};
exports.foldMutator = ({ table, data, }) => {
    const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
    if (seatIndex === -1 || seatIndex !== table.turnToBetIndex) {
        return table;
    }
    const nextSeatTurnIndex = utils_1.indexOfFirstNonFoldedSeatLeftOfSeatIndex(table, seatIndex);
    const tableWithFoldedSeat = Object.assign(Object.assign({}, table), { turnToBetIndex: nextSeatTurnIndex, seats: table.seats.map((s) => {
            return s.token === data.seatToken
                ? Object.assign(Object.assign({}, s), { isFolded: true }) : s;
        }) });
    const unfoldedSeats = tableWithFoldedSeat.seats.filter((s) => !s.isFolded);
    if (unfoldedSeats.length === 1) {
        // Only one player left in the hand. The hand is over.
        const winningSeatToken = unfoldedSeats[0].token;
        const awardedTable = exports.awardWinnersMutator({
            table,
            data: { winningSeatToken },
        });
        return exports.endHandMutator({ table: awardedTable, data: {} });
    }
    return endTurnMutator({
        table: tableWithFoldedSeat,
        data: { seatIndex },
    });
};
const endTurnMutator = ({ table, data, }) => {
    if (data.seatIndex !== table.roundTerminatingSeatIndex) {
        const nextSeatTurnIndex = utils_1.indexOfFirstNonFoldedSeatLeftOfSeatIndex(table, data.seatIndex);
        return Object.assign(Object.assign({}, table), { turnToBetIndex: nextSeatTurnIndex });
    }
    const seatsWithMoneyToBet = table.seats.filter((s) => !s.isFolded && !s.isBust && s.chipCount);
    if (seatsWithMoneyToBet.length < 2) {
        // Only 1 seat with money remaining to bet. Skip to
        let mutatedTable = table;
        while (mutatedTable.bettingRound !== "pre-deal") {
            mutatedTable = exports.endRoundMutator({ table: mutatedTable, data: {} });
        }
        return mutatedTable;
    }
    return exports.endRoundMutator({ table, data: {} });
};
exports.endRoundMutator = ({ table, }) => {
    switch (table.bettingRound) {
        case "pre-deal":
            return Object.assign(Object.assign({}, table), { bettingRound: "pre-flop" });
        case "pre-flop": {
            const { cards, deck } = poker_cards_1.drawCardsFromDeck(table.deck, 3);
            const turnToBetIndex = utils_1.indexOfFirstNonFoldedSeatLeftOfSeatIndex(table, table.dealerIndex);
            const roundTerminatingSeatIndex = utils_1.indexOfFirstNonFoldedSeatRightOfSeatIndex(table, turnToBetIndex);
            return exports.moveBetsToPotMutator({
                table: Object.assign(Object.assign({}, table), { bettingRound: "flop", deck: deck, communityCards: cards, turnToBetIndex,
                    roundTerminatingSeatIndex }),
                data: {},
            });
        }
        case "flop": {
            const { cards, deck } = poker_cards_1.drawCardsFromDeck(table.deck, 1);
            const turnToBetIndex = utils_1.indexOfFirstNonFoldedSeatLeftOfSeatIndex(table, table.dealerIndex);
            const roundTerminatingSeatIndex = utils_1.indexOfFirstNonFoldedSeatRightOfSeatIndex(table, turnToBetIndex);
            return exports.moveBetsToPotMutator({
                table: Object.assign(Object.assign({}, table), { bettingRound: "turn", deck, communityCards: [...table.communityCards, ...cards], turnToBetIndex,
                    roundTerminatingSeatIndex }),
                data: {},
            });
        }
        case "turn": {
            const { cards, deck } = poker_cards_1.drawCardsFromDeck(table.deck, 1);
            const turnToBetIndex = utils_1.indexOfFirstNonFoldedSeatLeftOfSeatIndex(table, table.dealerIndex);
            const roundTerminatingSeatIndex = utils_1.indexOfFirstNonFoldedSeatRightOfSeatIndex(table, turnToBetIndex);
            return exports.moveBetsToPotMutator({
                table: Object.assign(Object.assign({}, table), { bettingRound: "river", deck, communityCards: [...table.communityCards, ...cards], turnToBetIndex,
                    roundTerminatingSeatIndex }),
                data: {},
            });
        }
        case "river":
            const awardedTable = exports.awardWinnersMutator({
                table,
                data: {},
            });
            return exports.endHandMutator({ table: awardedTable, data: {} });
    }
};
exports.endHandMutator = ({ table, }) => {
    return Object.assign(Object.assign({}, table), { bettingRound: "pre-deal", dealerIndex: utils_1.indexOfFirstNonBustSeatToLeftOfIndex(table, table.dealerIndex), turnToBetIndex: undefined, splitPots: [], seats: table.seats.map((s) => {
            return Object.assign(Object.assign({}, s), { isFolded: false, isBust: s.chipCount === 0 });
        }) });
};
exports.awardWinnersMutator = ({ table, }) => {
    const remainingSeatsWithChips = table.seats.filter((s) => !s.isFolded && s.chipCount !== 0);
    if (remainingSeatsWithChips.length === 0) {
        return awardSplitPotsMutator({
            table,
            data: {},
        });
    }
    const remainingHands = remainingSeatsWithChips.map((s) => ({
        pocketCards: s.pocketCards,
        communityCards: table.communityCards,
    }));
    const chipsInPotTable = exports.moveBetsToPotMutator({ table, data: {} });
    const winningHands = poker_cards_1.findHighestHands(remainingHands);
    const winningSeats = winningHands.map((hand) => remainingSeatsWithChips[hand.candidateIndex]);
    const winningSeatTokens = winningSeats.map((s) => s.token);
    const chipsCountAwardedToWinners = Math.floor(chipsInPotTable.mainPotChipCount / winningHands.length);
    const chipsCountRemainingInPot = chipsInPotTable.mainPotChipCount -
        chipsCountAwardedToWinners * winningHands.length;
    const awardMainPotTable = Object.assign(Object.assign({}, chipsInPotTable), { mainPotChipCount: chipsCountRemainingInPot, seats: chipsInPotTable.seats.map((s) => {
            if (winningSeatTokens.includes(s.token)) {
                return Object.assign(Object.assign({}, s), { chipCount: s.chipCount + chipsCountAwardedToWinners });
            }
            return s;
        }) });
    return awardSplitPotsMutator({
        table: awardMainPotTable,
        data: {},
    });
};
const awardSplitPotsMutator = ({ table, }) => {
    const splitPotsAwardedTable = table.splitPots.reduce((accu, splitPot) => {
        const validSeats = accu.seats
            .filter((s) => !s.isFolded)
            .filter((s) => splitPot.seatTokens.includes(s.token));
        if (validSeats.length === 0) {
            return accu;
        }
        const potentialWinningHands = validSeats.map((s) => ({
            pocketCards: s.pocketCards,
            communityCards: table.communityCards,
        }));
        const winningHands = poker_cards_1.findHighestHands(potentialWinningHands);
        const winningSeats = winningHands.map((hand) => validSeats[hand.candidateIndex]);
        const winningSeatTokens = winningSeats.map((s) => s.token);
        const chipsCountAwardedToWinners = Math.floor(splitPot.chipCount / winningHands.length);
        const chipsCountMoveToPot = splitPot.chipCount - chipsCountAwardedToWinners * winningHands.length;
        return Object.assign(Object.assign({}, accu), { mainPotChipCount: accu.mainPotChipCount + chipsCountMoveToPot, seats: accu.seats.map((s) => {
                if (winningSeatTokens.includes(s.token)) {
                    return Object.assign(Object.assign({}, s), { chipCount: s.chipCount + chipsCountAwardedToWinners });
                }
                return s;
            }) });
    }, table);
    return splitPotsAwardedTable;
};
exports.moveBetsToPotMutator = ({ table, }) => {
    const splitPotTable = createSplitPotsMutator({ table, data: {} });
    const totalBetsFromRound = splitPotTable.seats.reduce((accu, s) => {
        return accu + s.chipsBetCount;
    }, 0);
    return Object.assign(Object.assign({}, splitPotTable), { mainPotChipCount: splitPotTable.mainPotChipCount + totalBetsFromRound, seats: splitPotTable.seats.map((s) => (Object.assign(Object.assign({}, s), { chipsBetCount: 0 }))) });
};
const createSplitPotsMutator = ({ table, }) => {
    const seatsThatWentAllInLowestToHighestBet = utils_1.getSeatsThatWentAllInLowestToHighestBet(table);
    if (!seatsThatWentAllInLowestToHighestBet.length) {
        // No split pots needed. Thank god, this shit is confusing
        return table;
    }
    return seatsThatWentAllInLowestToHighestBet.reduce((table, seat) => {
        return splitPotForSeatOptionsMutator({
            table,
            data: { seatToken: seat.token },
        });
    }, table);
};
const splitPotForSeatOptionsMutator = ({ table, data, }) => {
    const seat = table.seats.find((s) => s.token === data.seatToken);
    if (!seat) {
        return table;
    }
    const amountToBet = seat.chipsBetCount;
    const tableCopy = JSON.parse(JSON.stringify(table));
    // @ts-ignore
    tableCopy.mainPotChipCount = 0;
    const newSplitPot = {
        chipCount: table.mainPotChipCount,
        seatTokens: table.seats
            .filter((s) => !s.isFolded && s.chipsBetCount)
            .map((s) => s.token),
    };
    table.seats.forEach((s, index) => {
        if (s.chipsBetCount >= amountToBet) {
            // @ts-ignore
            tableCopy.seats[index].chipsBetCount = s.chipsBetCount - amountToBet;
            newSplitPot.chipCount = newSplitPot.chipCount + amountToBet;
        }
    });
    return Object.assign(Object.assign({}, tableCopy), { splitPots: [...table.splitPots, newSplitPot] });
};
//# sourceMappingURL=mutators.js.map