"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PaginationResultDto", {
    enumerable: true,
    get: function() {
        return PaginationResultDto;
    }
});
let PaginationResultDto = class PaginationResultDto {
    constructor(key, data, total, page, limit){
        this[key] = data;
        this.total = total;
        this.page = page;
        this.limit = limit;
        this.totalPages = Math.ceil(total / limit);
    }
};

//# sourceMappingURL=paginationResult.dto.js.map