"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CloudinaryConfig", {
    enumerable: true,
    get: function() {
        return CloudinaryConfig;
    }
});
const _cloudinary = require("cloudinary");
const CloudinaryConfig = {
    provide: 'CLOUDINARY',
    useFactory: ()=>{
        _cloudinary.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });
        return _cloudinary.v2;
    }
};

//# sourceMappingURL=cloudinary.config.js.map