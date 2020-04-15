import { getTable, saveTable } from "../../../state/state";
import { addPlayerToTableMutator } from "../../../state/mutators";

export const restJoinTable = async (req: any, res: any) => {
  const { tableName } = req.params;

  const table = await getTable(tableName);

  if (!table) {
    res.status(404).send({ error: "MeNoFindTable" });
    return;
  }

  const vacantSeat = table.seats.find((s) => s.isEmpty);

  if (!vacantSeat) {
    res.status(404).send({ error: "TableFull" });
    return;
  }

  const mutatedTable = addPlayerToTableMutator({
    table,
    data: { seatToken: vacantSeat.token },
  });

  await saveTable(mutatedTable);

  res.send({ seatToken: vacantSeat.token });
};
