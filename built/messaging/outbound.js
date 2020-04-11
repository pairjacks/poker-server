"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../state/utils");
const socketDisplayNameMap = {};
exports.registerWebsocket = (ws, displayName) => {
    socketDisplayNameMap[displayName] = ws;
};
exports.unregisterWebsocket = (displayName) => {
    delete socketDisplayNameMap[displayName];
};
exports.sendMessage = (ws, message) => {
    const messageString = JSON.stringify(message);
    ws.send(messageString);
};
exports.sendTableStateMessage = (table) => {
    table.seats.forEach((s) => {
        if (s.player) {
            const limitedTable = utils_1.stripPrivateTableDataForSeat({
                seatToken: s.token,
                table,
            });
            const tableState = {
                type: "table-state",
                table: limitedTable,
            };
            const socket = socketDisplayNameMap[s.token];
            if (socket) {
                exports.sendMessage(socket, tableState);
            }
        }
    });
};
//# sourceMappingURL=outbound.js.map