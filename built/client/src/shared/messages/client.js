"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClientMessage = (x) => {
    return typeof x.type === "string" && x.type.startsWith("client/");
};
//# sourceMappingURL=client.js.map