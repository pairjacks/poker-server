import { Table, Seat } from "./global";
import { LimitedTable } from "poker-messages";

/**
 * mod function that works correctly with negative numbers.
 * https://web.archive.org/web/20090717035140if_/javascript.about.com/od/problemsolving/a/modulobug.htm
 */
export const mod = (n: number, mod: number) => {
  return ((n % mod) + mod) % mod;
};

interface StripPrivateTableDataForSeatOptions {
  seatToken: string;
  table: Table;
}

export const stripPrivateTableDataForSeat = ({
  seatToken,
  table,
}: StripPrivateTableDataForSeatOptions): LimitedTable => {
  const playerSeat = table.seats.find((s) => s.token === seatToken);

  return {
    isStarted: table.isStarted,
    name: table.name,
    bettingRound: table.bettingRound,
    potChipCount: table.mainPotChipCount,
    splitPots: table.splitPots.map((sp) => {
      const players = sp.seatTokens.map((seatToken) => {
        const seat = table.seats.find((s) => s.token === seatToken);

        return seat?.player?.displayName || "unknown player";
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
      pocketCards:
        s.token === playerSeat?.token ||
        table.revealPocketIndeces.includes(index)
          ? s.pocketCards
          : undefined,
      player: s.player,
    })),
    currentUser: {
      seatToken,
      displayName: playerSeat?.player?.displayName || "",
    },
  };
};

export const randomDisplayName = () => {
  const emojis = [
    "👨‍🎨",
    "🕵️‍♂️",
    "🎃",
    "😈",
    "👹",
    "😼",
    "💂‍♀️",
    "👩‍⚕️",
    "👨‍🌾",
    "👮‍♂️",
    "🧕",
    "🧑‍🍳",
    "🧑‍🎤",
    "👩‍🎤",
    "👨‍🎤",
    "👩‍🎓",
    "👩‍🏫",
    "👨‍🚀",
    "👸🏻",
    "🤴",
    "🦹‍♂️",
    "🦸‍♀️",
    "🤶",
    "🎅",
    "🧜🏻‍♀️",
    "🧙‍♂️",
    "🧝‍♀️",
    "🧝",
    "🧛‍♂️",
    "🧟‍♂️",
    "🧞‍♂️",
    "💃",
    "🕺",
    "🧖‍♂️",
    "🦊",
  ];

  // const presidents = [
  //   "George Washington",
  //   "John Adams",
  //   "Thomas Jefferson",
  //   "James Madison",
  //   "James Monroe",
  //   "John Quincy Adams",
  //   "Andrew Jackson",
  //   "Martin Van Buren",
  //   "William Henry Harrison",
  //   "John Tyler",
  //   "James K. Polk",
  //   "Zachary Taylor",
  //   "Millard Fillmore",
  //   "Franklin Pierce",
  //   "James Buchanan",
  //   "Abraham Lincoln",
  //   "Andrew Johnson",
  //   "Ulysses S. Grant",
  //   "Rutherford B. Hayes",
  //   "James A. Garfield",
  //   "Chester A. Arthur",
  //   "Grover Cleveland",
  //   "Benjamin Harrison",
  //   "William McKinley",
  //   "Theodore Roosevelt",
  //   "William Howard Taft",
  //   "Woodrow Wilson",
  //   "Warren G. Harding",
  //   "Calvin Coolidge",
  //   "Herbert Hoover",
  //   "Franklin D. Roosevelt",
  //   "Harry S Truman",
  //   "Dwight D. Eisenhower",
  //   "John F. Kennedy",
  //   "Lyndon B. Johnson",
  //   "Richard Nixon",
  //   "Gerald Ford",
  //   "Jimmy Carter",
  //   "Ronald Reagan",
  //   "George H. W. Bush",
  //   "Bill Clinton",
  //   "George W. Bush",
  //   "Barack Obama",
  //   "Donald Trump",
  // ];

  return emojis[Math.floor(Math.random() * emojis.length)];
};

/**
 * Returns the index of the player whose turn it is next
 * Ignores players who have folded already.
 */
export const nextPlayerTurnIndex = (table: Table): number => {
  if (
    !table.turnToBetIndex ||
    table.turnToBetIndex === table.seats.length - 1
  ) {
    // It's currently the last players turn. Give turn to index 0;
    return 0;
  }

  return table.turnToBetIndex + 1;
};

export const findHighestBetAtTable = (table: Table): number => {
  return table.seats.reduce((accu, seat) => {
    return seat.chipsBetCount > accu ? seat.chipsBetCount : accu;
  }, 0);
};

const indexOfFirstSeatToRightOfIndex = (table: Table, seatIndex: number) => {
  const indexToTheRight = mod(seatIndex - 1, table.seats.length);
  return indexToTheRight;
};

export const indexOfFirstNonBustSeatToRightOfIndex = (
  table: Table,
  index: number
) => {
  let counter = 0;
  let nextPotentialPlayerIndex = indexOfFirstSeatToRightOfIndex(table, index);
  while (counter < table.seats.length) {
    if (!table.seats[nextPotentialPlayerIndex].isBust) {
      return nextPotentialPlayerIndex;
    }

    nextPotentialPlayerIndex = indexOfFirstSeatToRightOfIndex(
      table,
      nextPotentialPlayerIndex
    );

    counter++;
  }

  return index;
};

export const indexOfFirstNonFoldedNonAllInSeatRightOfSeatIndex = (
  table: Table,
  index: number
): number => {
  let counter = 0;
  let nextPotentialPlayerIndex = indexOfFirstNonBustSeatToRightOfIndex(
    table,
    index
  );
  while (counter < table.seats.length) {
    const seat = table.seats[nextPotentialPlayerIndex];

    if (!seat.isFolded && seat.chipCount) {
      return nextPotentialPlayerIndex;
    }

    nextPotentialPlayerIndex = indexOfFirstNonBustSeatToRightOfIndex(
      table,
      nextPotentialPlayerIndex
    );

    counter++;
  }

  return index;
};

const indexOfFirstSeatToLeftOfIndex = (table: Table, seatIndex: number) => {
  const indexToTheRight = mod(seatIndex + 1, table.seats.length);
  return indexToTheRight;
};

export const indexOfFirstNonBustSeatToLeftOfIndex = (
  table: Table,
  index: number
) => {
  let counter = 0;
  let nextPotentialPlayerIndex = indexOfFirstSeatToLeftOfIndex(table, index);
  while (counter < table.seats.length) {
    if (!table.seats[nextPotentialPlayerIndex].isBust) {
      return nextPotentialPlayerIndex;
    }

    nextPotentialPlayerIndex = indexOfFirstSeatToLeftOfIndex(
      table,
      nextPotentialPlayerIndex
    );

    counter++;
  }

  return index;
};

export const indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex = (
  table: Table,
  index: number
): number => {
  let counter = 0;
  let nextPotentialPlayerIndex = indexOfFirstNonBustSeatToLeftOfIndex(
    table,
    index
  );
  while (counter < table.seats.length) {
    const seat = table.seats[nextPotentialPlayerIndex];

    if (!seat.isFolded && seat.chipCount > 0) {
      return nextPotentialPlayerIndex;
    }

    nextPotentialPlayerIndex = indexOfFirstNonBustSeatToLeftOfIndex(
      table,
      nextPotentialPlayerIndex
    );

    counter++;
  }

  return index;
};

export const getSeatsThatWentAllInLowestToHighestBet = (
  table: Table
): Seat[] => {
  const seats = table.seats.filter((s) => s.chipsBetCount && s.chipCount === 0);

  seats.sort((s1, s2) => s1.chipsBetCount - s2.chipsBetCount);

  return seats;
};
