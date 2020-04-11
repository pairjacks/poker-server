"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * mod function that works correctly with negative numbers.
 * https://web.archive.org/web/20090717035140if_/javascript.about.com/od/problemsolving/a/modulobug.htm
 */
exports.mod = (n, mod) => {
    return ((n % mod) + mod) % mod;
};
exports.stripPrivateTableDataForSeat = ({ seatToken, table, }) => {
    var _a;
    const playerSeat = table.seats.find((s) => s.token === seatToken);
    return {
        isStarted: table.isStarted,
        name: table.name,
        bettingRound: table.bettingRound,
        potChipCount: table.mainPotChipCount,
        splitPots: table.splitPots.map(sp => {
            const players = sp.seatTokens.map(seatToken => {
                var _a;
                const seat = table.seats.find(s => s.token === seatToken);
                return ((_a = seat === null || seat === void 0 ? void 0 : seat.player) === null || _a === void 0 ? void 0 : _a.displayName) || "unknown player";
            });
            return {
                players,
                chipCount: sp.chipCount,
            };
        }),
        communityCards: table.communityCards,
        seats: table.seats.map((s, index) => ({
            token: s.token,
            isDealer: index === table.dealerIndex,
            isTurnToBet: index === table.turnToBetIndex,
            isFolded: s.isFolded,
            isBust: s.isBust,
            chipCount: s.chipCount,
            chipsBetCount: s.chipsBetCount,
            pocketCards: playerSeat === null || playerSeat === void 0 ? void 0 : playerSeat.pocketCards,
            player: s.player,
        })),
        currentUser: {
            seatToken,
            displayName: ((_a = playerSeat === null || playerSeat === void 0 ? void 0 : playerSeat.player) === null || _a === void 0 ? void 0 : _a.displayName) || "",
        },
    };
};
exports.randomDisplayName = () => {
    const presidents = [
        "George Washington",
        "John Adams",
        "Thomas Jefferson",
        "James Madison",
        "James Monroe",
        "John Quincy Adams",
        "Andrew Jackson",
        "Martin Van Buren",
        "William Henry Harrison",
        "John Tyler",
        "James K. Polk",
        "Zachary Taylor",
        "Millard Fillmore",
        "Franklin Pierce",
        "James Buchanan",
        "Abraham Lincoln",
        "Andrew Johnson",
        "Ulysses S. Grant",
        "Rutherford B. Hayes",
        "James A. Garfield",
        "Chester A. Arthur",
        "Grover Cleveland",
        "Benjamin Harrison",
        "William McKinley",
        "Theodore Roosevelt",
        "William Howard Taft",
        "Woodrow Wilson",
        "Warren G. Harding",
        "Calvin Coolidge",
        "Herbert Hoover",
        "Franklin D. Roosevelt",
        "Harry S Truman",
        "Dwight D. Eisenhower",
        "John F. Kennedy",
        "Lyndon B. Johnson",
        "Richard Nixon",
        "Gerald Ford",
        "Jimmy Carter",
        "Ronald Reagan",
        "George H. W. Bush",
        "Bill Clinton",
        "George W. Bush",
        "Barack Obama",
        "Donald Trump",
    ];
    return presidents[Math.floor(Math.random() * presidents.length)];
};
/**
 * Returns the index of the player whose turn it is next
 * Ignores players who have folded already.
 */
exports.nextPlayerTurnIndex = (table) => {
    if (!table.turnToBetIndex ||
        table.turnToBetIndex === table.seats.length - 1) {
        // It's currently the last players turn. Give turn to index 0;
        return 0;
    }
    return table.turnToBetIndex + 1;
};
exports.findHighestBetAtTable = (table) => {
    return table.seats.reduce((accu, seat) => {
        return seat.chipsBetCount > accu ? seat.chipsBetCount : accu;
    }, 0);
};
const indexOfFirstSeatToRightOfIndex = (table, seatIndex) => {
    const indexToTheRight = exports.mod(seatIndex - 1, table.seats.length);
    return indexToTheRight;
};
exports.indexOfFirstNonBustSeatToRightOfIndex = (table, index) => {
    let counter = 0;
    let nextPotentialPlayerIndex = indexOfFirstSeatToRightOfIndex(table, index);
    while (counter < table.seats.length) {
        if (!table.seats[nextPotentialPlayerIndex].isBust) {
            return nextPotentialPlayerIndex;
        }
        nextPotentialPlayerIndex = indexOfFirstSeatToRightOfIndex(table, nextPotentialPlayerIndex);
        counter++;
    }
    return index;
};
exports.indexOfFirstNonFoldedSeatRightOfSeatIndex = (table, index) => {
    let counter = 0;
    let nextPotentialPlayerIndex = exports.indexOfFirstNonBustSeatToRightOfIndex(table, index);
    while (counter < table.seats.length) {
        if (!table.seats[nextPotentialPlayerIndex].isFolded) {
            return nextPotentialPlayerIndex;
        }
        nextPotentialPlayerIndex = exports.indexOfFirstNonBustSeatToRightOfIndex(table, nextPotentialPlayerIndex);
        counter++;
    }
    return index;
};
const indexOfFirstSeatToLeftOfIndex = (table, seatIndex) => {
    const indexToTheRight = exports.mod(seatIndex + 1, table.seats.length);
    return indexToTheRight;
};
exports.indexOfFirstNonBustSeatToLeftOfIndex = (table, index) => {
    let counter = 0;
    let nextPotentialPlayerIndex = indexOfFirstSeatToLeftOfIndex(table, index);
    while (counter < table.seats.length) {
        if (!table.seats[nextPotentialPlayerIndex].isBust) {
            return nextPotentialPlayerIndex;
        }
        nextPotentialPlayerIndex = indexOfFirstSeatToLeftOfIndex(table, nextPotentialPlayerIndex);
        counter++;
    }
    return index;
};
exports.indexOfFirstNonFoldedSeatLeftOfSeatIndex = (table, index) => {
    let counter = 0;
    let nextPotentialPlayerIndex = exports.indexOfFirstNonBustSeatToLeftOfIndex(table, index);
    while (counter < table.seats.length) {
        const seat = table.seats[nextPotentialPlayerIndex];
        if (!seat.isFolded && seat.chipCount > 0) {
            return nextPotentialPlayerIndex;
        }
        nextPotentialPlayerIndex = exports.indexOfFirstNonBustSeatToLeftOfIndex(table, nextPotentialPlayerIndex);
        counter++;
    }
    return index;
};
exports.getSeatsThatWentAllInLowestToHighestBet = (table) => {
    const seats = table.seats.filter((s) => s.chipsBetCount && s.chipCount === 0);
    seats.sort((s1, s2) => s1.chipsBetCount - s2.chipsBetCount);
    return seats;
};
//# sourceMappingURL=utils.js.map