"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("../../state/global");
const outbound_1 = require("../outbound");
exports.requestTableState = (ws, data) => {
    const table = global_1.getTable(data.tableName);
    if (!table) {
        return;
    }
    outbound_1.sendTableStateMessage(table);
};
//# sourceMappingURL=requestTableState.js.map