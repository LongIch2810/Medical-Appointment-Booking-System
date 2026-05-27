"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "mapFileType", {
    enumerable: true,
    get: function() {
        return mapFileType;
    }
});
const _FileType = require("../shared/enums/FileType");
const mapFileType = (resourceType)=>{
    switch(resourceType){
        case 'image':
            return _FileType.FileType.IMAGE;
        case 'video':
            return _FileType.FileType.VIDEO;
        case 'raw':
            return _FileType.FileType.DOCUMENT;
        default:
            return _FileType.FileType.OTHER;
    }
};

//# sourceMappingURL=mapFileType.js.map