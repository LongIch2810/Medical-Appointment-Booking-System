"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WebsocketGateway", {
    enumerable: true,
    get: function() {
        return WebsocketGateway;
    }
});
const _jwt = require("@nestjs/jwt");
const _websockets = require("@nestjs/websockets");
const _socketio = require("socket.io");
const _messagesservice = require("../modules/messages/messages.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let WebsocketGateway = class WebsocketGateway {
    handleConnection(client) {
        const token = this._extractTokenFromCookie(client);
        console.log('>>> token: ', token);
        if (!token) {
            client.emit('ws-error', {
                code: 401,
                message: 'Invalid token'
            });
            return false;
        }
        try {
            const payload = this.jwtService.verify(token, {
                secret: process.env.ACCESS_TOKEN_SECRET || 'secret'
            });
            client.data.user = payload;
            client.data.token = token;
            const userId = client.data.user.sub;
            if (userId) {
                this.clients.set(Number(userId), client.id);
                client.join(`user:${userId}`);
                console.log(`User ${userId} connected with socketId ${client.id}`);
            }
        } catch (err) {
            client.emit('ws-error', {
                code: 401,
                message: 'Invalid token'
            });
        }
    }
    handleDisconnect(client) {
        this.clients.forEach((socketId, userId)=>{
            if (socketId === client.id) {
                this.clients.delete(userId);
                console.log(`User ${userId} disconnected`);
            }
        });
    }
    handleJoinChannel(data, client) {
        client.join(`room:${data.data.channel_id}`);
        this.server.to(`user:${data.data.userId}`).emit('notify:event', {
            id: data.id,
            isSuccess: true
        });
    }
    async handleSendMessage(data) {
        const message = await this.messagesService.saveMessage(data.data);
        this.server.to(`room:${data.data.channel_id}`).emit(`receive:message`, message);
        this.server.to(`user:${data.data.userId}`).emit('notify:event', {
            id: data.id,
            isSuccess: true
        });
    }
    notifyBookAppointmentSuccess(userId, data) {
        console.log('userId: ', userId);
        console.log('data: ', data);
        this.server.to(`user:${userId}`).emit('appointment:success', data);
        this.server.emit('appointment:slotBooked', {
            id: data.id,
            doctor_schedule_id: data.doctor_schedule.id,
            appointment_date: data.appointment_date,
            status: data.status,
            booking_mode: data.booking_mode,
            created_at: data.created_at,
            updated_at: data.updated_at,
            deleted_at: data.deleted_at
        });
    }
    notifyBookAppointmentFail(userId, message) {
        const socketId = this.clients.get(userId);
        if (socketId) {
            this.server.to(`user:${userId}`).emit('appointment:fail', message);
        }
    }
    notifyUpdatedFilesMessage(message) {
        const channel_id = message.channel.id;
        this.server.to(`room:${channel_id}`).emit('updated:message:files', message);
    }
    notifyUpdatedFilesArticle(userId, article) {
        const socketId = this.clients.get(userId);
        if (socketId) {
            this.server.to(`user:${userId}`).emit('updated:article:files', article);
        }
    }
    constructor(messagesService, jwtService){
        this.messagesService = messagesService;
        this.jwtService = jwtService;
        this.clients = new Map();
        this._extractTokenFromCookie = (client)=>{
            try {
                const cookies = client?.handshake?.headers?.cookie;
                if (!cookies) return null;
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
    }
};
_ts_decorate([
    (0, _websockets.WebSocketServer)(),
    _ts_metadata("design:type", typeof _socketio.Server === "undefined" ? Object : _socketio.Server)
], WebsocketGateway.prototype, "server", void 0);
_ts_decorate([
    (0, _websockets.SubscribeMessage)('channel:join'),
    _ts_param(0, (0, _websockets.MessageBody)()),
    _ts_param(1, (0, _websockets.ConnectedSocket)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _socketio.Socket === "undefined" ? Object : _socketio.Socket
    ]),
    _ts_metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleJoinChannel", null);
_ts_decorate([
    (0, _websockets.SubscribeMessage)('send:message'),
    _ts_param(0, (0, _websockets.MessageBody)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleSendMessage", null);
WebsocketGateway = _ts_decorate([
    (0, _websockets.WebSocketGateway)({
        cors: {
            origin: 'http://localhost:5173',
            credentials: true
        }
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _messagesservice.MessagesService === "undefined" ? Object : _messagesservice.MessagesService,
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService
    ])
], WebsocketGateway);

//# sourceMappingURL=websocket.gateway.js.map