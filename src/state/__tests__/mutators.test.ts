import { Face, Suit, Cards } from "@pairjacks/poker-cards";
import {
  placeBetMutator,
  dealMutator,
  checkMutator,
  endHandMutator,
  moveBetsToPotMutator,
  awardWinnersMutator,
  callMutator,
  foldMutator,
} from "../mutators";
import { mod } from "../utils";
import { Table } from "../state";

const mockDeck: Cards = [
  [Face.Ace, Suit.Hearts],
  [Face.Ace, Suit.Diamonds],
  [Face.Ace, Suit.Clubs],
  [Face.Ace, Suit.Spades],
  [Face.King, Suit.Hearts],
  [Face.King, Suit.Diamonds],
  [Face.King, Suit.Clubs],
  [Face.King, Suit.Spades],
  [Face.Queen, Suit.Spades],
];

export const createMockTable = (startingChipCount: number): Table => {
  return {
    isStarted: false,
    name: "test-table",
    bettingRound: "pre-deal",
    roundTerminatingSeatIndex: 0,
    activePot: { seatTokens: ["a","b","c","d"], chipCount: 0 },
    maxBetChipCount: 4 * startingChipCount,
    highlightRelevantCards: false,
    splitPots: [],
    dealerIndex: 0,
    turnToBetIndex: 0,
    revealPocketIndeces: [],
    smallBlind: 1,
    deck: mockDeck,
    communityCards: [],
    seats: [
      {
        token: "a",
        chipCount: startingChipCount,
        chipsBetCount: 0,
        pocketCards: [],
        isEmpty: false,
        isFolded: false,
        isBust: false,
        displayName: "💃"
      },
      {
        token: "b",
        chipCount: startingChipCount,
        chipsBetCount: 0,
        pocketCards: [],
        isFolded: false,
        isBust: false,
        isEmpty: false,
        displayName: "💃"
      },
      {
        token: "c",
        chipCount: startingChipCount,
        chipsBetCount: 0,
        pocketCards: [],
        isFolded: false,
        isBust: false,
        isEmpty: false,
        displayName: "💃"
      },
      {
        token: "d",
        chipCount: startingChipCount,
        chipsBetCount: 0,
        pocketCards: [],
        isFolded: false,
        isBust: false,
        isEmpty: false,
        displayName: "💃"
      },
    ],
  };
};

describe("mutators", () => {
  describe("mod", () => {
    it("mods positive and negative numbers properly", () => {
      expect(mod(0, 10)).toBe(0);
      expect(mod(-10, 10)).toBe(0);
      expect(mod(13, 10)).toBe(3);
      expect(mod(5, 10)).toBe(5);
      expect(mod(-1, 10)).toBe(9);
      expect(mod(-2, 10)).toBe(8);
      expect(mod(-12, 10)).toBe(8);
    });
  });

  describe("dealMutator", () => {
    it("Does nothing if the table betting round is not pre-deal", () => {
      const table = createMockTable(100);
      //@ts-ignore
      table.bettingRound = "pre-flop";

      const mutatedTable = dealMutator({
        table,
        data: { seatToken: "a", deck: mockDeck },
      });

      expect(mutatedTable).toBe(table);
    });

    it("Does nothing if a player tries to deal who is not the dealer", () => {
      const table = createMockTable(100);
      const mutatedTable = dealMutator({
        table,
        data: { seatToken: "b", deck: mockDeck },
      });
      expect(mutatedTable).toBe(table);
    });

    it("As part of the deal it places the bets for big and small blinds", () => {
      const table = createMockTable(100);
      const mutatedTable = dealMutator({
        table,
        data: { seatToken: "a", deck: mockDeck },
      });

      expect(mutatedTable).not.toBe(table);

      const smallBlindSeat = mutatedTable.seats[1];
      const bigBlindSeat = mutatedTable.seats[2];

      expect(smallBlindSeat.chipsBetCount).toBe(1);
      expect(smallBlindSeat.chipCount).toBe(99);
      expect(bigBlindSeat.chipsBetCount).toBe(2);
      expect(bigBlindSeat.chipCount).toBe(98);
    });

    it("Sets the turn to bet to the player left of the big blind if there are at least 3 players", () => {
      const table = createMockTable(100);
      const mutatedTable = dealMutator({
        table,
        data: { seatToken: "a", deck: mockDeck },
      });

      expect(mutatedTable).not.toBe(table);
      expect(mutatedTable.turnToBetIndex).toBe(3);
    });

    it("Only deals cards to players who aren't bust", () => {
      const table = createMockTable(100);

      // @ts-ignore
      table.seats[1].isBust = true;

      const mutatedTable = dealMutator({
        table,
        data: { seatToken: "a", deck: mockDeck },
      });

      expect(mutatedTable).not.toBe(table);
      expect(mutatedTable.seats[0].pocketCards.length).toBe(2);
      expect(mutatedTable.seats[1].pocketCards.length).toBe(0);
      expect(mutatedTable.seats[2].pocketCards.length).toBe(2);
      expect(mutatedTable.seats[3].pocketCards.length).toBe(2);
    });

    it("Handles heads up poker by dealer as the small blind and the first to bet", () => {
      const table = createMockTable(100);
      // @ts-ignore
      table.seats = [table.seats[0], table.seats[1]];
      // @ts-ignore
      table.dealerIndex = 1;

      const mutatedTable = dealMutator({
        table,
        data: { seatToken: "b", deck: mockDeck },
      });

      expect(mutatedTable).not.toBe(table);
      expect(mutatedTable.seats[0].chipsBetCount).toBe(2);
      expect(mutatedTable.seats[1].chipsBetCount).toBe(1);
      expect(mutatedTable.turnToBetIndex).toBe(1);
    });
  });

  describe("placeBetMutator", () => {
    it("Ignored the bet if an invalid seat token is passed", () => {
      const table = createMockTable(100);
      const mutatedTable = placeBetMutator({
        table,
        data: { seatToken: "f", betChipCount: 10 },
      });
      expect(mutatedTable).toBe(table);
    });

    it("Ignores the bet if the it's not the turn of the player betting", () => {
      const table = { ...createMockTable(100), turnToBetIndex: 0 };

      const mutatedTable = placeBetMutator({
        table,
        data: { seatToken: "b", betChipCount: 10 },
      });

      expect(mutatedTable).toBe(table);
    });

    it("Ignores the bet if the bet is not more than the highest bet currently at the table. If the bet is equal the player should use call, not bet.", () => {
      const table = createMockTable(100);
      // @ts-ignore
      table.turnToBetIndex = 1;
      // @ts-ignore
      table.seats[0].chipsBetCount = 10;

      /**
       * It's b's turn to bet and a has already bet 10. b tries to
       * bet 9 but that's less than a's bet the bet is ignored.
       */

      const mutatedTable = placeBetMutator({
        table,
        data: { seatToken: "b", betChipCount: 10 },
      });

      expect(mutatedTable).toBe(table);
    });

    it("Ignores the bet if the bet is less than highest bet currently at the table.", () => {
      const table = createMockTable(100);
      // @ts-ignore
      table.turnToBetIndex = 1;
      // @ts-ignore
      table.seats[0].chipsBetCount = 10;

      /**
       * It's b's turn to bet and a has already bet 10. b tries to
       * bet 9 but that's less than a's bet the bet is ignored.
       */

      const mutatedTable = placeBetMutator({
        table,
        data: { seatToken: "b", betChipCount: 9 },
      });

      expect(mutatedTable).toBe(table);
    });

    it("Sets the correct roundTerminatingSeatIndex when a player at the table is all in", () => {
      const table = createMockTable(100);

      // @ts-ignore
      table.seats = [table.seats[0], table.seats[1], table.seats[2]];

      // @ts-ignore
      table.seats[0].chipCount = 0;
      // @ts-ignore
      table.seats[1].chipCount = 50;
      // @ts-ignore
      table.seats[2].chipCount = 100;

      // @ts-ignore
      table.seats[0].chipsBetCount = 20;
      // @ts-ignore
      table.seats[1].chipsBetCount = 0;
      // @ts-ignore
      table.seats[2].chipsBetCount = 0;

      // @ts-ignore
      table.turnToBetIndex = 1;

      const mutatedTable = placeBetMutator({
        table,
        data: { seatToken: "b", betChipCount: 40 },
      });

      expect(mutatedTable).not.toBe(table);
      expect(mutatedTable.turnToBetIndex).toBe(2);
      expect(mutatedTable.roundTerminatingSeatIndex).toBe(2);
    });

    it("Allows a bet to be lower the the current highest bet if it's an all in.", () => {
      const table = createMockTable(100);
      // @ts-ignore
      table.seats[0].chipsBetCount = 50;
      // @ts-ignore
      table.seats[1].chipCount = 30;
      // @ts-ignore
      table.turnToBetIndex = 1;

      const mutatedTable = placeBetMutator({
        table,
        data: { seatToken: "b", betChipCount: 30 },
      });

      expect(mutatedTable.seats[1].chipCount).toBe(0);
      expect(mutatedTable.seats[1].chipsBetCount).toBe(30);
      expect(mutatedTable.turnToBetIndex).toBe(2);
      expect(mutatedTable.roundTerminatingSeatIndex).toBe(0);
    });

    it("Places a valid bet and moves to the next players turn", () => {
      const table = createMockTable(100);
      // @ts-ignore
      table.seats[2].isFolded = true;
      // @ts-ignore
      table.turnToBetIndex = 1;

      const mutatedTable = placeBetMutator({
        table,
        data: { seatToken: "b", betChipCount: 10 },
      });

      expect(mutatedTable.seats[1].chipCount).toBe(90);
      expect(mutatedTable.seats[1].chipsBetCount).toBe(10);
      expect(mutatedTable.turnToBetIndex).toBe(3); // c (index 2) is folded so turn should be index 3.
      expect(mutatedTable.roundTerminatingSeatIndex).toBe(0);
    });

    it("Places a valid bet and moves to the next players turn", () => {
      const table = createMockTable(100);
      // @ts-ignore
      table.seats[0].isFolded = true;
      // @ts-ignore
      table.seats[1].isFolded = true;
      // @ts-ignore
      table.turnToBetIndex = 2;

      const mutatedTable = placeBetMutator({
        table,
        data: { seatToken: "c", betChipCount: 10 },
      });

      expect(mutatedTable.seats[2].chipCount).toBe(90);
      expect(mutatedTable.seats[2].chipsBetCount).toBe(10);
      expect(mutatedTable.turnToBetIndex).toBe(3); // c (index 2) is folded so turn should be index 3.
      expect(mutatedTable.roundTerminatingSeatIndex).toBe(3);
    });

    it("plays skips to the end of the game in heads up poker both players go all in", () => {
      const table = createMockTable(50);

      // @ts-ignore
      table.deck = [
        [Face.Two, Suit.Hearts],
        [Face.Seven, Suit.Diamonds],
        [Face.Four, Suit.Clubs],
        [Face.Nine, Suit.Spades],
        [Face.Five, Suit.Hearts],
        [Face.Jack, Suit.Diamonds],
        [Face.Two, Suit.Clubs],
        [Face.Seven, Suit.Spades],
        [Face.Queen, Suit.Spades],
      ];

      // @ts-ignore
      table.seats = [table.seats[0], table.seats[1]];
      // @ts-ignore
      table.bettingRound = 'pre-flop';

      // @ts-ignore
      table.seats[0].chipCount = 100;
      // @ts-ignore
      table.seats[0].chipsBetCount = 2;
      // @ts-ignore
      table.seats[0].pocketCards = [
        [Face.Ace, Suit.Diamonds],
        [Face.Ace, Suit.Clubs],
      ];

      // @ts-ignore
      table.seats[1].chipCount = 50;
      // @ts-ignore
      table.seats[1].chipsBetCount = 2;
      // @ts-ignore
      table.seats[1].pocketCards = [
        [Face.King, Suit.Diamonds],
        [Face.King, Suit.Clubs],
      ];

      // @ts-ignore
      table.dealerIndex = 1;
      // @ts-ignore
      table.turnToBetIndex = 0;

      const table1 = placeBetMutator({
        table,
        data: { seatToken: "a", betChipCount: 100 },
      });

      expect(table1).not.toBe(table);
      expect(table1.turnToBetIndex).toBe(1);
      expect(table1.roundTerminatingSeatIndex).toBe(1);
      expect(table1.seats[0].chipsBetCount).toBe(102);

      const table2 = placeBetMutator({
        table: table1,
        data: { seatToken: "b", betChipCount: 50 },
      });

      expect(table2).not.toBe(table1);
      expect(table2.bettingRound).toBe("pre-deal");
      expect(table2.activePot.chipCount).toBe(0);
      expect(table2.splitPots).toEqual([]);
      expect(table2.seats[0].chipCount).toBe(154);
    });
  });

  describe("foldMutator", () => {
    it("Folds properly and rewards the right winning in heads up poker", () => {
      const table = createMockTable(0);

      // @ts-ignore
      table.deck = [
        [Face.Two, Suit.Hearts],
        [Face.Seven, Suit.Diamonds],
        [Face.Four, Suit.Clubs],
        [Face.Nine, Suit.Spades],
        [Face.Five, Suit.Hearts],
        [Face.Jack, Suit.Diamonds],
        [Face.Two, Suit.Clubs],
        [Face.Seven, Suit.Spades],
        [Face.Queen, Suit.Spades],
      ];
      
      // @ts-ignore
      table.bettingRound = "pre-flop";

      // @ts-ignore
      table.seats = [table.seats[0], table.seats[1]];

      // @ts-ignore
      table.seats[0].chipCount = 100;
      // @ts-ignore
      table.seats[0].chipsBetCount = 2;
      // @ts-ignore
      table.seats[0].pocketCards = [
        [Face.King, Suit.Diamonds],
        [Face.King, Suit.Clubs],
      ];

      // @ts-ignore
      table.seats[1].chipCount = 0;
      // @ts-ignore
      table.seats[1].chipsBetCount = 6;
      // @ts-ignore
      table.seats[1].pocketCards = [
        [Face.Ace, Suit.Diamonds],
        [Face.Ace, Suit.Clubs],
      ];

      // @ts-ignore
      table.turnToBetIndex = 0;

      const mutatedTable = foldMutator({ table, data: { seatToken: "a" } });

      expect(mutatedTable).not.toBe(table);
      expect(mutatedTable.bettingRound).toBe("pre-deal");
      expect(mutatedTable.seats[1].chipCount).toBe(8);
    });
  });

  describe("checkMutator", () => {
    it("Does nothing if the seat checking isn't the seat who's turn it is", () => {
      const table = createMockTable(100);

      //@ts-ignore
      table.turnToBetIndex = 1;

      const mutatedTable = checkMutator({
        table,
        data: { seatToken: "a" },
      });

      expect(mutatedTable).toBe(table);
    });

    it("Does nothing if the seat checking hasn't paid enough to play", () => {
      const table = createMockTable(100);

      //@ts-ignore
      table.turnToBetIndex = 2;
      //@ts-ignore
      table.seats[0].isFolded = true;
      //@ts-ignore
      table.seats[1].chipsBetCount = 10;

      const mutatedTable = checkMutator({
        table,
        data: { seatToken: "c" },
      });

      expect(mutatedTable).toBe(table);
    });

    it("Changes the turnToBetIndex if it's a valid check and they aren't the roundTerminatingSeatIndex", () => {
      const table = createMockTable(100);

      //@ts-ignore
      table.roundTerminatingSeatIndex = 3;
      //@ts-ignore
      table.turnToBetIndex = 2;
      //@ts-ignore
      table.seats[0].isFolded = true;
      //@ts-ignore
      table.seats[1].chipsBetCount = 10;
      //@ts-ignore
      table.seats[2].chipsBetCount = 10;

      const mutatedTable = checkMutator({
        table,
        data: { seatToken: "c" },
      });

      expect(mutatedTable).toEqual({
        ...table,
        turnToBetIndex: 3,
      });
    });

    it("Moves to the next round if it's seatIndex is roundTerminatingSeatIndex", () => {
      const table = createMockTable(100);

      //@ts-ignore
      table.bettingRound = "pre-flop";
      //@ts-ignore
      table.roundTerminatingSeatIndex = 2;
      //@ts-ignore
      table.turnToBetIndex = 2;
      //@ts-ignore
      table.seats[0].isFolded = true;
      //@ts-ignore
      table.seats[1].chipsBetCount = 10;
      //@ts-ignore
      table.seats[2].chipsBetCount = 10;
      //@ts-ignore
      table.seats[3].isFolded = true;

      const mutatedTable = checkMutator({
        table,
        data: { seatToken: "c" },
      });

      expect(mutatedTable).not.toBe(table);
      expect(mutatedTable.turnToBetIndex).toBe(1);
      expect(mutatedTable.bettingRound).toBe("flop");
      expect(mutatedTable.communityCards.length).toBe(3);
      expect(mutatedTable.deck.length).toBe(table.deck.length - 3);
    });
  });

  describe("endHandMutator", () => {
    it("Sets the betting round to pre-deal", () => {
      const table = createMockTable(100);

      const mutatedTable = endHandMutator({ table, data: {} });

      expect(mutatedTable.bettingRound).toBe("pre-deal");
    });

    it("Moves the dealer to the first non bust player to the left of the current dealer", () => {
      const table = createMockTable(100);

      //@ts-ignore
      table.dealerIndex = 1;
      //@ts-ignore
      table.seats[2].chipCount = 0;
      //@ts-ignore
      table.seats[2].isBust = true;

      const mutatedTable = endHandMutator({ table, data: {} });

      // Seat 2 is bust so the deal skips right to 3
      expect(mutatedTable.dealerIndex).toBe(3);
    });

    it("sets all newly bust players as isBust and moves the dealer to the first non bust player even if they went out this hand", () => {
      const table = createMockTable(100);

      //@ts-ignore
      table.dealerIndex = 1;
      //@ts-ignore
      table.seats[2].chipCount = 0;

      const mutatedTable = endHandMutator({ table, data: {} });

      // Seat 2 is bust so the deal skips right to 3
      expect(mutatedTable.dealerIndex).toBe(3);
      expect(mutatedTable.seats[2].isBust).toBeTruthy();
    });

    it("It resets data that is no longer relevant", () => {
      const table = createMockTable(100);

      const mockCards = [
        [Face.Ace, Suit.Hearts],
        [Face.King, Suit.Hearts],
      ];

      //@ts-ignore
      table.turnToBetIndex = 1;
      //@ts-ignore
      table.seats[2].isFolded = true;
      //@ts-ignore
      table.seats[0].pocketCards = mockCards;
      //@ts-ignore
      table.seats[1].pocketCards = mockCards;
      //@ts-ignore
      table.seats[2].pocketCards = mockCards;
      //@ts-ignore
      table.seats[3].pocketCards = mockCards;
      //@ts-ignore
      table.communityCards = mockCards;

      const mutatedTable = endHandMutator({ table, data: {} });

      // Seat 2 is bust so the deal skips right to 3
      expect(mutatedTable.dealerIndex).toBe(1);
      expect(mutatedTable.turnToBetIndex).toBe(undefined);
      expect(mutatedTable.seats[0].isFolded).toEqual(false);
      expect(mutatedTable.seats[1].isFolded).toEqual(false);
      expect(mutatedTable.seats[2].isFolded).toEqual(false);
      expect(mutatedTable.seats[3].isFolded).toEqual(false);
    });

    it("It marks seats as bust if they are out of chips", () => {
      const table = createMockTable(100);

      //@ts-ignore
      table.seats[2].chipCount = 0;

      const mutatedTable = endHandMutator({ table, data: {} });

      expect(mutatedTable.seats[0].isBust).toBe(false);
      expect(mutatedTable.seats[1].isBust).toBe(false);
      expect(mutatedTable.seats[2].isBust).toBe(true); // Went bust
      expect(mutatedTable.seats[3].isBust).toBe(false);
    });
  });

  describe("moveBetsToPotMutator", () => {
    it("Create split pots if needed", () => {
      const table = createMockTable(100);

      table.activePot.chipCount = 40;

      // @ts-ignore
      table.seats[0].chipCount = 90;
      // @ts-ignore
      table.seats[0].chipsBetCount = 20;

      // @ts-ignore
      table.seats[1].chipCount = 0;
      // @ts-ignore
      table.seats[1].chipsBetCount = 10;

      // @ts-ignore
      table.seats[2].chipCount = 110;
      // @ts-ignore
      table.seats[2].chipsBetCount = 20;

      const mutatedTable = moveBetsToPotMutator({ table, data: {} });

      expect(mutatedTable.splitPots.length).toBe(1);
      expect(mutatedTable.splitPots[0].chipCount).toBe(30 + 40); // Split pot = Bets (30) + Pot (40)
    });
  });

  describe("awardWinnersMutator", () => {
    it("Awards the winning hand 100% of the pot when there is no draw or split pots", () => {
      const table = createMockTable(100);

      // @ts-ignore
      // Seat 0 has the best hand.
      table.seats[0].pocketCards = [
        [Face.Ace, Suit.Hearts],
        [Face.Ace, Suit.Diamonds],
      ];

      // @ts-ignore
      table.seats[1].pocketCards = [
        [Face.King, Suit.Hearts],
        [Face.King, Suit.Diamonds],
      ];

      // @ts-ignore
      table.seats[2].pocketCards = [
        [Face.Queen, Suit.Hearts],
        [Face.Queen, Suit.Diamonds],
      ];

      // @ts-ignore
      table.seats[3].pocketCards = [
        [Face.Jack, Suit.Hearts],
        [Face.Jack, Suit.Diamonds],
      ];

      // @ts-ignore
      table.communityCards = [
        [Face.Four, Suit.Clubs],
        [Face.Four, Suit.Spades],
        [Face.Four, Suit.Diamonds],
        [Face.Six, Suit.Hearts],
        [Face.Two, Suit.Diamonds],
      ];

      // @ts-ignore
      table.activePot.chipCount = 100;

      const mutatedTable = awardWinnersMutator({ table, data: {} });

      expect(mutatedTable.activePot.chipCount).toBe(0);
      expect(mutatedTable.seats[0].chipCount).toBe(200);
    });

    it("Splits the main pot amoungst the winners. If it can't be split evenly the remainder is left in the pot.", () => {
      const table = createMockTable(100);

      // Seat 0,1,2 tie for best hand.

      // @ts-ignore
      table.seats[0].pocketCards = [
        [Face.Ace, Suit.Hearts],
        [Face.Jack, Suit.Diamonds],
      ];

      // @ts-ignore
      table.seats[1].pocketCards = [
        [Face.Ace, Suit.Diamonds],
        [Face.Jack, Suit.Hearts],
      ];

      // @ts-ignore
      table.seats[2].pocketCards = [
        [Face.Ace, Suit.Clubs],
        [Face.Jack, Suit.Clubs],
      ];

      // @ts-ignore
      table.seats[3].pocketCards = [
        [Face.Two, Suit.Clubs],
        [Face.Three, Suit.Diamonds],
      ];

      // @ts-ignore
      table.communityCards = [
        [Face.Ace, Suit.Spades],
        [Face.Jack, Suit.Spades],
        [Face.Four, Suit.Diamonds],
        [Face.Six, Suit.Hearts],
        [Face.Four, Suit.Hearts],
      ];

      // @ts-ignore
      table.activePot.chipCount = 100;

      const mutatedTable = awardWinnersMutator({ table, data: {} });

      expect(mutatedTable.seats[0].chipCount).toBe(133);
      expect(mutatedTable.seats[1].chipCount).toBe(133);
      expect(mutatedTable.seats[2].chipCount).toBe(133);
      expect(mutatedTable.activePot.chipCount).toBe(1);
    });

    it("Awards splitpots properly", () => {
      const table = createMockTable(100);

      // @ts-ignore
      table.splitPots = [{ seatTokens: ["a", "b", "c"], chipCount: 30 }];

      // @ts-ignore
      table.seats[0].chipCount = 0;
      // @ts-ignore
      table.seats[1].chipCount = 100;
      // @ts-ignore
      table.seats[2].chipCount = 100;
      // @ts-ignore
      table.seats[3].isFolded = true;

      // @ts-ignore
      // Best Hand
      table.seats[0].pocketCards = [
        [Face.Ace, Suit.Hearts],
        [Face.Ace, Suit.Spades],
      ];

      // @ts-ignore
      // Second Best Hand
      table.seats[1].pocketCards = [
        [Face.King, Suit.Diamonds],
        [Face.Jack, Suit.Hearts],
      ];

      // @ts-ignore
      table.seats[2].pocketCards = [
        [Face.Queen, Suit.Diamonds],
        [Face.Jack, Suit.Spades],
      ];

      // @ts-ignore
      table.communityCards = [
        [Face.Ace, Suit.Diamonds],
        [Face.Ace, Suit.Clubs],
        [Face.King, Suit.Spades],
        [Face.Six, Suit.Hearts],
        [Face.Four, Suit.Hearts],
      ];

      // @ts-ignore
      table.activePot = { seatTokens: ["b", "c"], chipCount: 100 }; // Awarded to "b" since "a" went all in and can only be awarded the split pots

      const mutatedTable = awardWinnersMutator({ table, data: {} });

      expect(mutatedTable.seats[0].chipCount).toBe(30);
      expect(mutatedTable.seats[1].chipCount).toBe(200); // b lost the split pot but won the main pot against c.
    });
  });

  describe("callMutator", () => {
    it("Ignores the action if calling involves betting more chips than the user has", () => {
      const table = createMockTable(20);

      // @ts-ignore
      table.seats[0].chipsBetCount = 21;
      // @ts-ignore
      table.turnToBetIndex = 1;

      const mutatedTable = callMutator({ table, data: { seatToken: "b" } });

      expect(mutatedTable).toBe(table);
    });

    it("Skips right to the end of the round if no more betting is possible after call because 1 or less players still playing the hand have money to bet", () => {
      const table = createMockTable(20);

      // @ts-ignore
      table.seats = [table.seats[0], table.seats[1]];

      // @ts-ignore
      table.seats[0].chipCount = 0;
      // @ts-ignore
      table.seats[0].chipsBetCount = 20;

      const tokenAWinsDeck: Cards = [
        [Face.Ace, Suit.Diamonds],
        [Face.Ace, Suit.Clubs],
        [Face.King, Suit.Hearts],
        [Face.King, Suit.Spades],
        [Face.King, Suit.Diamonds],
        [Face.Ace, Suit.Hearts],
        [Face.Ace, Suit.Spades],
        [Face.Jack, Suit.Spades],
        [Face.Nine, Suit.Diamonds],
      ];

      const deltTable = dealMutator({
        table,
        data: { seatToken: "a", deck: tokenAWinsDeck },
      });

      // @ts-ignore
      deltTable.seats[0].pocketCards = [
        [Face.Ace, Suit.Hearts],
        [Face.Ace, Suit.Spades],
      ];

      // @ts-ignore
      deltTable.seats[1].pocketCards = [
        [Face.Seven, Suit.Hearts],
        [Face.Two, Suit.Spades],
      ];

      // @ts-ignore
      deltTable.turnToBetIndex = 1;
      // @ts-ignore
      deltTable.roundTerminatingSeatIndex = 1;

      const mutatedTable = callMutator({
        table: deltTable,
        data: { seatToken: "b" },
      });

      expect(mutatedTable.bettingRound).toBe("pre-deal");
      expect(mutatedTable.seats[0].chipCount).toBe(40);
      expect(mutatedTable.seats[1].chipCount).toBe(0);
    });
  });
});
