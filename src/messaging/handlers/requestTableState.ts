import WebSocket from "ws";
import { getTable } from "../../state/global";
import { sendTableStateMessage } from "../outbound";
import { ClientRequestTableStateMessage } from "poker-messages";

export const requestTableState = (ws: WebSocket, data: ClientRequestTableStateMessage) => {
  const table = getTable(data.tableName);
  if (!table) {
    return;
  }

  sendTableStateMessage(table);
};