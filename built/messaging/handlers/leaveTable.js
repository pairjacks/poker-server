"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("../../state/global");
const outbound_1 = require("../outbound");
const mutators_1 = require("../../state/mutators");
exports.leaveTable = (ws, data) => {
    const table = global_1.getTable(data.tableName);
    if (!table) {
        return;
    }
    const mutatedTable = mutators_1.removePlayerFromTableMutator({
        table,
        data: {
            seatToken: data.seatToken
        }
    });
    global_1.saveTable(mutatedTable);
    outbound_1.sendMessage(ws, {
        type: "table-state",
        table: undefined
    });
    outbound_1.sendTableStateMessage(mutatedTable);
};
//# sourceMappingURL=leaveTable.js.map