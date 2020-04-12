import { Cards, drawCardsFromDeck, findHighestHands } from "poker-cards";
import { Table, Player, Seat } from "./global";
import {
  indexOfFirstNonBustSeatToLeftOfIndex,
  findHighestBetAtTable,
  indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex,
  indexOfFirstNonFoldedNonAllInSeatRightOfSeatIndex,
  getSeatsThatWentAllInLowestToHighestBet,
} from "./utils";

type TableMutatorFunction<T> = (args: TableMutatorArgs<T>) => Table;

interface TableMutatorArgs<T> {
  table: Table;
  data: T;
}

interface AddPlayerToTableOptions {
  seatToken: string;
  player: Player;
}

export const addPlayerToTableMutator: TableMutatorFunction<AddPlayerToTableOptions> = ({
  table,
  data,
}): Table => {
  return {
    ...table,
    seats: table.seats.map((s) => {
      if (s.token === data.seatToken) {
        return { ...s, player: data.player };
      }

      return s;
    }),
  };
};

interface RemovePlayerFromTableOptions {
  seatToken: string;
}

export const removePlayerFromTableMutator: TableMutatorFunction<RemovePlayerFromTableOptions> = ({
  table,
  data,
}): Table => {
  return {
    ...table,
    seats: table.seats.map((s) => {
      if (s.token === data.seatToken) {
        return { ...s, player: undefined };
      }

      return s;
    }),
  };
};

// Contains all available options for starting a game
interface StartGameOptions {}

export const startGameMutator: TableMutatorFunction<StartGameOptions> = ({
  table,
}): Table => {
  return {
    ...table,
    isStarted: true,
  };
};

interface DealOptions {
  seatToken: string;
  deck: Cards;
}

export const dealMutator: TableMutatorFunction<DealOptions> = ({
  table,
  data,
}): Table => {
  if (table.bettingRound !== "pre-deal") {
    return table;
  }

  const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
  if (seatIndex === -1 || seatIndex !== table.dealerIndex) {
    return table;
  }

  const smallBlindIndex =
    table.seats.length === 2
      ? table.dealerIndex
      : indexOfFirstNonBustSeatToLeftOfIndex(table, table.dealerIndex);

  const smallBlindsTurnTable = {
    ...table,
    turnToBetIndex: smallBlindIndex,
  };
  const smallBlindSeatToken = table.seats[smallBlindIndex].token;

  const smallBlindBetTable = placeBetMutator({
    table: smallBlindsTurnTable,
    data: {
      seatToken: smallBlindSeatToken,
      betChipCount: table.smallBlind,
    },
  });

  const bigBlindIndex = indexOfFirstNonBustSeatToLeftOfIndex(
    table,
    smallBlindIndex
  );
  const bigBlindSeatToken = table.seats[bigBlindIndex].token;
  const bigBlindBetTable = placeBetMutator({
    table: smallBlindBetTable,
    data: {
      seatToken: bigBlindSeatToken,
      betChipCount: table.smallBlind * 2,
    },
  });

  // First turn is left of big blind except in head up poker when it's the dealer.
  const firstTurnIndex =
    table.seats.length === 2
      ? table.dealerIndex
      : indexOfFirstNonBustSeatToLeftOfIndex(bigBlindBetTable, bigBlindIndex);

  // Assign pocket cards to seats. Use a reduce to encapsulate return type
  // of draw cards function
  const withPockets = bigBlindBetTable.seats.reduce(
    (acc: { seats: Seat[]; deck: Cards }, seat) => {
      const { cards, deck } = drawCardsFromDeck(acc.deck, 2);

      return {
        deck,
        seats: acc.seats.concat({
          ...seat,
          pocketCards: seat.isBust ? [] : cards,
        }),
      };
    },
    { seats: [], deck: data.deck }
  );

  return {
    ...bigBlindBetTable,
    bettingRound: "pre-flop",
    seats: withPockets.seats.map((s) => ({ ...s, isFolded: s.isBust })),
    deck: withPockets.deck,
    communityCards: [],
    revealPocketIndexs: [],
    turnToBetIndex: firstTurnIndex,
    roundTerminatingSeatIndex: bigBlindIndex,
  };
};

interface PlaceBetOptions {
  seatToken: string;
  betChipCount: number;
}

export const placeBetMutator: TableMutatorFunction<PlaceBetOptions> = ({
  table,
  data,
}): Table => {
  const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
  if (seatIndex === -1 || seatIndex !== table.turnToBetIndex) {
    return table;
  }

  const seat = table.seats[seatIndex];

  if (seat.chipCount < data.betChipCount) {
    return table;
  }

  const minimumChipsToPlay = findHighestBetAtTable(table);

  if (
    seat.chipsBetCount + data.betChipCount <= minimumChipsToPlay &&
    seat.chipCount !== data.betChipCount
  ) {
    // They didn't bet enough and this is not an all in.
    return table;
  }

  const nextSeatTurnIndex = indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex(
    table,
    seatIndex
  );

  return {
    ...table,
    turnToBetIndex: nextSeatTurnIndex,
    roundTerminatingSeatIndex: indexOfFirstNonFoldedNonAllInSeatRightOfSeatIndex(
      table,
      seatIndex
    ),
    seats: table.seats.map((s) => {
      return s.token === data.seatToken
        ? {
            ...s,
            chipCount: s.chipCount - data.betChipCount,
            chipsBetCount: s.chipsBetCount + data.betChipCount,
          }
        : s;
    }),
  };
};

interface CallOptions {
  seatToken: string;
}

export const callMutator: TableMutatorFunction<CallOptions> = ({
  table,
  data,
}): Table => {
  const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
  if (seatIndex === -1 || seatIndex !== table.turnToBetIndex) {
    return table;
  }

  const seat = table.seats[seatIndex];

  const costToPlay = findHighestBetAtTable(table);
  const chipsToPay = costToPlay - seat.chipsBetCount;

  if (chipsToPay > seat.chipCount) {
    return table;
  }

  return endTurnMutator({
    table: {
      ...table,
      seats: table.seats.map((s) => {
        return s.token === data.seatToken
          ? {
              ...s,
              chipCount: s.chipCount - chipsToPay,
              chipsBetCount: s.chipsBetCount + chipsToPay,
            }
          : s;
      }),
    },
    data: { seatIndex },
  });
};

interface CheckOptions {
  seatToken: string;
}

export const checkMutator: TableMutatorFunction<CheckOptions> = ({
  table,
  data,
}): Table => {
  const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
  if (seatIndex === -1 || seatIndex !== table.turnToBetIndex) {
    return table;
  }

  const seat = table.seats[seatIndex];
  const currentHighestBet = findHighestBetAtTable(table);

  if (seat.chipsBetCount < currentHighestBet) {
    return table;
  }

  return endTurnMutator({ table, data: { seatIndex } });
};

interface FoldOptions {
  seatToken: string;
}

export const foldMutator: TableMutatorFunction<FoldOptions> = ({
  table,
  data,
}): Table => {
  const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
  if (seatIndex === -1 || seatIndex !== table.turnToBetIndex) {
    return table;
  }

  const nextSeatTurnIndex = indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex(
    table,
    seatIndex
  );

  const tableWithFoldedSeat = {
    ...table,
    turnToBetIndex: nextSeatTurnIndex,
    seats: table.seats.map((s) => {
      return s.token === data.seatToken
        ? {
            ...s,
            isFolded: true,
          }
        : s;
    }),
  };

  const unfoldedSeats = tableWithFoldedSeat.seats.filter((s) => !s.isFolded);
  if (unfoldedSeats.length === 1) {
    // Only one player left in the hand. The hand is over.
    const winningSeatToken = unfoldedSeats[0].token;
    const awardedTable = awardWinnersMutator({
      table,
      data: { winningSeatToken },
    });
    return endHandMutator({ table: awardedTable, data: {} });
  }

  return endTurnMutator({
    table: tableWithFoldedSeat,
    data: { seatIndex },
  });
};

/**
 * Private Mutators
 */

interface EndTurnOptions {
  seatIndex: number;
}

const endTurnMutator: TableMutatorFunction<EndTurnOptions> = ({
  table,
  data,
}): Table => {
  if (data.seatIndex !== table.roundTerminatingSeatIndex) {
    const nextSeatTurnIndex = indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex(
      table,
      data.seatIndex
    );
    return {
      ...table,
      turnToBetIndex: nextSeatTurnIndex,
    };
  }

  const seatsWithMoneyToBet = table.seats.filter(
    (s) => !s.isFolded && !s.isBust && s.chipCount
  );

  if (seatsWithMoneyToBet.length < 2) {
    // Only 1 seat with money remaining to bet. Skip to
    let mutatedTable = table;
    while (mutatedTable.bettingRound !== "pre-deal") {
      mutatedTable = endRoundMutator({ table: mutatedTable, data: {} });
    }
    return mutatedTable;
  }

  return endRoundMutator({ table, data: {} });
};

interface EndRoundOptions {}

export const endRoundMutator: TableMutatorFunction<EndRoundOptions> = ({
  table,
}): Table => {
  switch (table.bettingRound) {
    case "pre-deal":
      return {
        ...table,
        bettingRound: "pre-flop",
      };
    case "pre-flop": {
      const { cards, deck } = drawCardsFromDeck(table.deck, 3);

      const turnToBetIndex = indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex(
        table,
        table.dealerIndex
      );
      const roundTerminatingSeatIndex = indexOfFirstNonFoldedNonAllInSeatRightOfSeatIndex(
        table,
        turnToBetIndex
      );

      return moveBetsToPotMutator({
        table: {
          ...table,
          bettingRound: "flop",
          deck: deck,
          communityCards: cards,
          turnToBetIndex,
          roundTerminatingSeatIndex,
        },
        data: {},
      });
    }

    case "flop": {
      const { cards, deck } = drawCardsFromDeck(table.deck, 1);
      const turnToBetIndex = indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex(
        table,
        table.dealerIndex
      );
      const roundTerminatingSeatIndex = indexOfFirstNonFoldedNonAllInSeatRightOfSeatIndex(
        table,
        turnToBetIndex
      );

      return moveBetsToPotMutator({
        table: {
          ...table,
          bettingRound: "turn",
          deck,
          communityCards: [...table.communityCards, ...cards],
          turnToBetIndex,
          roundTerminatingSeatIndex,
        },
        data: {},
      });
    }

    case "turn": {
      const { cards, deck } = drawCardsFromDeck(table.deck, 1);
      const turnToBetIndex = indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex(
        table,
        table.dealerIndex
      );
      const roundTerminatingSeatIndex = indexOfFirstNonFoldedNonAllInSeatRightOfSeatIndex(
        table,
        turnToBetIndex
      );

      return moveBetsToPotMutator({
        table: {
          ...table,
          bettingRound: "river",
          deck,
          communityCards: [...table.communityCards, ...cards],
          turnToBetIndex,
          roundTerminatingSeatIndex,
        },
        data: {},
      });
    }

    case "river":
      const awardedTable = awardWinnersMutator({
        table,
        data: {},
      });

      return endHandMutator({ table: awardedTable, data: {} });
  }
};

interface EndHandOptions {}

export const endHandMutator: TableMutatorFunction<EndHandOptions> = ({
  table,
}): Table => {
  const revealHandTable = revealWinningHandsMutator({ table, data: {} });

  return {
    ...revealHandTable,
    bettingRound: "pre-deal",
    dealerIndex: indexOfFirstNonBustSeatToLeftOfIndex(
      revealHandTable,
      revealHandTable.dealerIndex
    ),
    turnToBetIndex: undefined,
    splitPots: [],
    seats: revealHandTable.seats.map((s) => {
      return {
        ...s,
        isFolded: false,
        isBust: s.chipCount === 0,
      };
    }),
  };
};

interface RevealWinningHandsOptions {}

export const revealWinningHandsMutator: TableMutatorFunction<RevealWinningHandsOptions> = ({
  table,
}): Table => {
  const unfoldedSeats = table.seats.filter((s) => !s.isBust && !s.isFolded);

  if (unfoldedSeats.length < 2) {
    return table;
  }

  const remainingHands = unfoldedSeats.map((s) => ({
    pocketCards: s.pocketCards,
    communityCards: table.communityCards,
  }));

  const winningTokens = findHighestHands(remainingHands).map((hand) => {
    return unfoldedSeats[hand.candidateIndex].token;
  });

  const winningIndexs = winningTokens.reduce((accu, token) => {
    const index = table.seats.findIndex((s) => s.token === token);
    return index === -1 ? accu : [...accu, index];
  }, [] as number[]);

  return {
    ...table,
    revealPocketIndexs: winningIndexs,
  };
};

interface AwardWinnersOptions {}

export const awardWinnersMutator: TableMutatorFunction<AwardWinnersOptions> = ({
  table,
}): Table => {
  const remainingSeatsWithChips = table.seats.filter(
    (s) => !s.isFolded && s.chipCount !== 0
  );

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

  const chipsInPotTable = moveBetsToPotMutator({ table, data: {} });

  const winningHands = findHighestHands(remainingHands);
  const winningSeats = winningHands.map(
    (hand) => remainingSeatsWithChips[hand.candidateIndex]
  );
  const winningSeatTokens = winningSeats.map((s) => s.token);
  const chipsCountAwardedToWinners = Math.floor(
    chipsInPotTable.mainPotChipCount / winningHands.length
  );
  const chipsCountRemainingInPot =
    chipsInPotTable.mainPotChipCount -
    chipsCountAwardedToWinners * winningHands.length;

  const awardMainPotTable: Table = {
    ...chipsInPotTable,
    mainPotChipCount: chipsCountRemainingInPot,
    seats: chipsInPotTable.seats.map((s) => {
      if (winningSeatTokens.includes(s.token)) {
        return {
          ...s,
          chipCount: s.chipCount + chipsCountAwardedToWinners,
        };
      }

      return s;
    }),
  };

  return awardSplitPotsMutator({
    table: awardMainPotTable,
    data: {},
  });
};

interface AwardSplitPotsMutatorOptions {}

const awardSplitPotsMutator: TableMutatorFunction<AwardSplitPotsMutatorOptions> = ({
  table,
}): Table => {
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

    const winningHands = findHighestHands(potentialWinningHands);

    const winningSeats = winningHands.map(
      (hand) => validSeats[hand.candidateIndex]
    );
    const winningSeatTokens = winningSeats.map((s) => s.token);
    const chipsCountAwardedToWinners = Math.floor(
      splitPot.chipCount / winningHands.length
    );
    const chipsCountMoveToPot =
      splitPot.chipCount - chipsCountAwardedToWinners * winningHands.length;

    return {
      ...accu,
      mainPotChipCount: accu.mainPotChipCount + chipsCountMoveToPot,
      seats: accu.seats.map((s) => {
        if (winningSeatTokens.includes(s.token)) {
          return {
            ...s,
            chipCount: s.chipCount + chipsCountAwardedToWinners,
          };
        }

        return s;
      }),
    };
  }, table);

  return splitPotsAwardedTable;
};

interface MoveBetsToPotOptions {}

export const moveBetsToPotMutator: TableMutatorFunction<MoveBetsToPotOptions> = ({
  table,
}): Table => {
  const splitPotTable = createSplitPotsMutator({ table, data: {} });

  const totalBetsFromRound = splitPotTable.seats.reduce((accu, s) => {
    return accu + s.chipsBetCount;
  }, 0);

  return {
    ...splitPotTable,
    mainPotChipCount: splitPotTable.mainPotChipCount + totalBetsFromRound,
    seats: splitPotTable.seats.map((s) => ({ ...s, chipsBetCount: 0 })),
  };
};

interface CreateSplitPotsOptions {}

const createSplitPotsMutator: TableMutatorFunction<CreateSplitPotsOptions> = ({
  table,
}): Table => {
  const seatsThatWentAllInLowestToHighestBet = getSeatsThatWentAllInLowestToHighestBet(
    table
  );

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

interface SplitPotForSeatOptions {
  seatToken: string;
}

const splitPotForSeatOptionsMutator: TableMutatorFunction<SplitPotForSeatOptions> = ({
  table,
  data,
}): Table => {
  const seat = table.seats.find((s) => s.token === data.seatToken);
  if (!seat) {
    return table;
  }

  const amountToBet = seat.chipsBetCount;

  const tableCopy = JSON.parse(JSON.stringify(table)) as Table;
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

  return {
    ...tableCopy,
    splitPots: [...table.splitPots, newSplitPot],
  };
};
