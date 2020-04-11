"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("../../state/global");
const outbound_1 = require("../outbound");
const mutators_1 = require("../../state/mutators");
const poker_cards_1 = require("@kavsingh/poker-cards");
exports.deal = (ws, message) => __awaiter(void 0, void 0, void 0, function* () {
    const table = global_1.getTable(message.tableName);
    if (!table) {
        return;
    }
    const deck = yield poker_cards_1.shuffleDeckNaive(poker_cards_1.createDeck());
    const mutatedTable = mutators_1.dealMutator({
        table,
        data: { seatToken: message.seatToken, deck },
    });
    global_1.saveTable(mutatedTable);
    outbound_1.sendTableStateMessage(mutatedTable);
});
//# sourceMappingURL=deal.js.map