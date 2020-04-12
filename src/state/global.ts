import { Cards } from "@pairjacks/poker-cards";

/**
 * Table contains the entire state of a poker table
 * it knows everything. This should never be directly
 * exposed to the client
 */
export interface Table {
  readonly isStarted: boolean;
  readonly name: string;
  readonly smallBlind: number;
  readonly bettingRound: BettingRound;
  readonly mainPotChipCount: number;
  readonly splitPots: SplitPot[];

  readonly dealerIndex: number;
  readonly roundTerminatingSeatIndex: number;
  readonly turnToBetIndex?: number;
  readonly revealPocketIndeces: number[];
  readonly lastSeatTokenToBetOnTheRiver?: string;

  readonly seats: Seat[];

  readonly deck: Cards;
  readonly communityCards: Cards;
}

export interface SplitPot {
  seatTokens: string[];
  chipCount: number;
}

export type BettingRound = "pre-deal" | "pre-flop" | "flop" | "turn" | "river";

export interface Seat {
  readonly token: string;
  readonly chipCount: number;
  readonly player?: Player;
  readonly pocketCards: Cards;
  readonly chipsBetCount: number;
  readonly isFolded: boolean;
  readonly isBust: boolean;
}

export interface Player {
  readonly displayName: string;
}

const tables: { [tableName: string]: Table | undefined } = {};

export const saveTable = (table: Table) => {
  tables[table.name] = table;
};

export const getTable = (tableName: string): Table | undefined => {
  return tables[tableName];
};
