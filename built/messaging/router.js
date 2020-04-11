"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createTable_1 = require("./handlers/createTable");
const requestTableState_1 = require("./handlers/requestTableState");
const joinTable_1 = require("./handlers/joinTable");
const leaveTable_1 = require("./handlers/leaveTable");
const startGame_1 = require("./handlers/startGame");
const placeBet_1 = require("./handlers/placeBet");
const deal_1 = require("./handlers/deal");
const poker_messages_1 = require("poker-messages");
const fold_1 = require("./handlers/fold");
const call_1 = require("./handlers/call");
const check_1 = require("./handlers/check");
exports.processMessage = (ws, message) => {
    if (!poker_messages_1.isClientMessage(message)) {
        console.log("Warning: Received invalid message: ", message);
        return;
    }
    console.log("Recieved Incoming Message: ", message);
    switch (message.type) {
        case "client/create-table":
            createTable_1.createTable(ws, message);
            break;
        case "client/request-table-state":
            requestTableState_1.requestTableState(ws, message);
            break;
        case "client/join-table":
            joinTable_1.joinTable(ws, message);
            break;
        case "client/leave-table":
            leaveTable_1.leaveTable(ws, message);
            break;
        case "client/start-game":
            startGame_1.startGame(ws, message);
            break;
        case "client/deal":
            deal_1.deal(ws, message);
            break;
        case "client/place-bet":
            placeBet_1.placeBet(ws, message);
            break;
        case "client/call":
            call_1.call(ws, message);
            break;
        case "client/check":
            check_1.check(ws, message);
            break;
        case "client/fold":
            fold_1.fold(ws, message);
            break;
    }
};
//# sourceMappingURL=router.js.map