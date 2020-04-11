"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tables = {};
exports.saveTable = (table) => {
    tables[table.name] = table;
};
exports.getTable = (tableName) => {
    return tables[tableName];
};
//# sourceMappingURL=global.js.map