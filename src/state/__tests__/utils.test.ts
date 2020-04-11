import { getSeatsThatWentAllInLowestToHighestBet } from "../utils";
import { Face, Suit } from "poker-cards";
import { Table } from "../global";

export const createMockTable = (startingChipCount: number): Table => {
  return {
    isStarted: false,
    name: "test-table",
    bettingRound: "pre-deal",
    roundTerminatingSeatIndex: 0,
    mainPotChipCount: 0,
    splitPots: [],
    dealerIndex: 0,
    turnToBetIndex: 0,
    smallBlind: 1,
    deck: [
      [Face.Ace, Suit.Hearts],
      [Face.Ace, Suit.Diamonds],
      [Face.Ace, Suit.Clubs],
      [Face.Ace, Suit.Spades],
      [Face.King, Suit.Hearts],
      [Face.King, Suit.Diamonds],
      [Face.King, Suit.Clubs],
      [Face.King, Suit.Spades],
    ],
    communityCards: [],
    seats: [
      {
        token: "a",
        chipCount: startingChipCount,
        chipsBetCount: 0,
        pocketCards: [],
        isFolded: false,
        isBust: false,
      },
      {
        token: "b",
        chipCount: startingChipCount,
        chipsBetCount: 0,
        pocketCards: [],
        isFolded: false,
        isBust: false,
      },
      {
        token: "c",
        chipCount: startingChipCount,
        chipsBetCount: 0,
        pocketCards: [],
        isFolded: false,
        isBust: false,
      },
      {
        token: "d",
        chipCount: startingChipCount,
        chipsBetCount: 0,
        pocketCards: [],
        isFolded: false,
        isBust: false,
      },
    ],
  };
};

describe("utils", () => {
  describe("getSeatsThatWentAllInLowestToHighestBet", () => {
    it("Finds all the seats at a table that went all in and sorts them from lowest to highest bet", () => {
      const table = createMockTable(100);

      // @ts-ignore
      table.seats[0].chipCount = 0;
      // @ts-ignore
      table.seats[1].chipCount = 0;
      // @ts-ignore
      table.seats[0].chipsBetCount = 40;
      // @ts-ignore
      table.seats[1].chipsBetCount = 30;

      const seatsThatWentAllInLowestToHighestBet = getSeatsThatWentAllInLowestToHighestBet(
        table
      );

      expect(seatsThatWentAllInLowestToHighestBet[0]).toBe(table.seats[1]);
      expect(seatsThatWentAllInLowestToHighestBet[1]).toBe(table.seats[0]);
    });
  });
});
