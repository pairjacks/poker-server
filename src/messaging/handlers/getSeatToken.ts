import { getTable } from "../../state/state";

export const getSeatToken = async (req: any, res: any) => {
  const { tableName } = req.params;

  const table = await getTable(tableName);

  if (!table) {
    res.status(404).send({ error: 'MeNoFindTable' });
    return;
  }

  const vacantSeat = table.seats.find(s => s.isEmpty);

  if (!vacantSeat) {
    res.status(404).send({ error: 'TableFull' });
    return;
  }

  res.send({ seatToken: vacantSeat.token })
};