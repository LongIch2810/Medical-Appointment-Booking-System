"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "extractTokenFromCookie", {
    enumerable: true,
    get: function() {
        return extractTokenFromCookie;
    }
});
const extractTokenFromCookie = (client)=>{
    try {
        const cookies = client?.handshake?.headers?.cookie;
        if (!cookies) return null;
        console.log('>>> cookies : ', cookies);
        const cookieArray = cookies.split('; ');
        console.log('>>> cookieArray : ', cookieArray);
        const cookieMap = cookieArray.reduce((acc, cookie)=>{
            const [key, value] = cookie.split('=');
            if (key && value) acc[key.trim()] = decodeURIComponent(value);
            return acc;
        }, {});
        console.log('>>> cookieMap : ', cookieMap);
        return cookieMap['accessToken'] || null;
    } catch (error) {
        return null;
    }
};

//# sourceMappingURL=extractTokenFromCookie.js.map