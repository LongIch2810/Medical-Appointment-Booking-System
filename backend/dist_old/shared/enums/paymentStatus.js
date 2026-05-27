"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PaymentStatus", {
    enumerable: true,
    get: function() {
        return PaymentStatus;
    }
});
var PaymentStatus = /*#__PURE__*/ function(PaymentStatus) {
    PaymentStatus["UNPAID"] = "UNPAID";
    PaymentStatus["PAID30PERCENT"] = "PAID 30%";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    return PaymentStatus;
}({});

//# sourceMappingURL=paymentStatus.js.map