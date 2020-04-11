"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("../../state/global");
const outbound_1 = require("../outbound");
const mutators_1 = require("../../state/mutators");
exports.call = (ws, message) => {
    const table = global_1.getTable(message.tableName);
    if (!table) {
        return;
    }
    const mutatedTable = mutators_1.callMutator({
        table,
        data: {
            seatToken: message.seatToken,
        },
    });
    global_1.saveTable(mutatedTable);
    outbound_1.sendTableStateMessage(mutatedTable);
};
//# sourceMappingURL=call.js.map