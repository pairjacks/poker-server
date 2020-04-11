"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("../../state/global");
const outbound_1 = require("../outbound");
const mutators_1 = require("../../state/mutators");
const utils_1 = require("../../state/utils");
exports.joinTable = (ws, data) => {
    const table = global_1.getTable(data.tableName);
    if (!table || !table.seats.find(s => s.token === data.seatToken)) {
        return;
    }
    const mutatedTable = mutators_1.addPlayerToTableMutator({
        table,
        data: {
            seatToken: data.seatToken,
            player: {
                displayName: utils_1.randomDisplayName(),
            }
        }
    });
    outbound_1.registerWebsocket(ws, data.seatToken);
    ws.on("close", () => {
        outbound_1.unregisterWebsocket(data.seatToken);
    });
    global_1.saveTable(mutatedTable);
    outbound_1.sendTableStateMessage(mutatedTable);
};
//# sourceMappingURL=joinTable.js.map