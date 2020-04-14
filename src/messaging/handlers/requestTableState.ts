import WebSocket from "ws";
import { getTable } from "../../state/state";
import { sendTableStateMessage } from "../outbound";
import { ClientRequestTableStateMessage } from "@pairjacks/poker-messages";

export const requestTableState = async (ws: WebSocket, data: ClientRequestTableStateMessage) => {
  const table = await getTable(data.tableName);
  sendTableStateMessage(table);
};