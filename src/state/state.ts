import redis from "redis";
import { promisify } from "util";
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
  readonly activePot: Pot;
  readonly splitPots: Pot[];
  readonly maxBetChipCount: number;
  readonly highlightRelevantCards: boolean;

  readonly dealerIndex: number;
  readonly roundTerminatingSeatIndex: number;
  readonly turnToBetIndex?: number;
  readonly revealPocketIndeces: number[];
  readonly lastSeatTokenToBetOnTheRiver?: string;

  readonly seats: Seat[];

  readonly deck: Cards;
  readonly communityCards: Cards;
}

export interface Pot {
  seatTokens: string[];
  chipCount: number;
}

export type BettingRound = "pre-deal" | "pre-flop" | "flop" | "turn" | "river";

export interface Seat {
  readonly token: string;
  readonly isEmpty: boolean;
  readonly chipCount: number;
  readonly displayName: string;
  readonly pocketCards: Cards;
  readonly chipsBetCount: number;
  readonly isFolded: boolean;
  readonly isBust: boolean;
}

const redisClient = process.env.REDIS_URL
  ? redis.createClient(process.env.REDIS_URL)
  : redis.createClient(6379);

const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.setex).bind(redisClient);

export const saveTable = async (table: Table): Promise<string> => {
  const secondsInADay = 86400;
  return setAsync(table.name, secondsInADay, JSON.stringify(table));
};

export const getTable = async (tableName: string): Promise<Table> => {
  const tableJSON = await getAsync(tableName);
  return JSON.parse(tableJSON);
};
