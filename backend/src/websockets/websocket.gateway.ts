import { UseFilters, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  WebSocketServer,
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Article from 'src/entities/article.entity';
import { MessageResponseDto } from 'src/modules/messages/dto/response/messageResponse.dto';
import { MessagesService } from 'src/modules/messages/messages.service';
import { NotificationResponseDto } from 'src/modules/notifications/dto/response/notificationResponse.dto';
import { WEBSOCKET_RATE_LIMIT_POLICIES } from 'src/common/rate-limit/rate-limit.constants';
import { SessionAuthService } from 'src/modules/auth/session-auth.service';
import { WsCookieAuthGuard } from 'src/common/guards/wsCookieAuth.guard';
import { WebsocketConnectionRateLimitService } from './websocket-connection-rate-limit.service';
import { WsRateLimitFilter } from './ws-rate-limit.filter';
import { WsRateLimitGuard } from './ws-rate-limit.guard';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://localhost:5183',
      'http://127.0.0.1:5183',
      'http://localhost:4183',
      'http://127.0.0.1:4183',
      'https://patientuilifehealth.vercel.app',
      'https://medical-appointment-booking-system-u75m.onrender.com',
      'https://adminmanagementuilifehealth.vercel.app',
    ],
    credentials: true,
  },
})
@UseGuards(WsCookieAuthGuard, WsRateLimitGuard)
@UseFilters(WsRateLimitFilter)
@Throttle(WEBSOCKET_RATE_LIMIT_POLICIES.event)
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private messagesService: MessagesService,
    private sessionAuthService: SessionAuthService,
    private websocketConnectionRateLimitService: WebsocketConnectionRateLimitService,
  ) {}

  @WebSocketServer()
  server: Server;

  private clients = new Map<number, string>();

  async handleConnection(client: Socket): Promise<void> {
    const connectionReady = this.initializeConnection(client);
    client.data.connectionReady = connectionReady;

    try {
      await connectionReady;
    } finally {
      if (client.data.connectionReady === connectionReady) {
        delete client.data.connectionReady;
      }
    }
  }

  private async initializeConnection(client: Socket): Promise<void> {
    const connectionRateLimit =
      await this.websocketConnectionRateLimitService.consume(client);
    if (!connectionRateLimit.allowed) {
      client.emit('ws-error', connectionRateLimit.error);
      client.disconnect(true);
      return;
    }

    const token = this._extractTokenFromCookie(client);
    if (!token) {
      this.rejectUnauthorizedClient(client);
      return;
    }

    try {
      const validated =
        await this.sessionAuthService.validateAccessToken(token);

      // client.data.user giữ đúng shape { sub, roles, ... } mà
      // getAuthenticatedUserId()/WsCookieAuthGuard kỳ vọng.
      client.data.user = {
        sub: validated.userId,
        roles: validated.roles,
        tokenId: validated.tokenId,
        sessionVersion: validated.sessionVersion,
      };
      client.data.token = token;

      this.clients.set(validated.userId, client.id);
      void client.join(`user:${validated.userId}`);
    } catch {
      this.rejectUnauthorizedClient(client);
    }
  }

  handleDisconnect(client: Socket) {
    this.clients.forEach((socketId, userId) => {
      if (socketId === client.id) {
        this.clients.delete(userId);
        console.log(`User ${userId} disconnected`);
      }
    });
  }

  @SubscribeMessage('channel:join')
  async handleJoinChannel(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getAuthenticatedUserId(client);
    const channelId = Number(data?.data?.channel_id);
    await this.messagesService.assertChannelMember(userId, channelId);
    await client.join(`room:${channelId}`);
    client.emit('notify:event', {
      id: data.id,
      isSuccess: true,
    });
  }

  @SubscribeMessage('channel:leave')
  handleLeaveChannel(
    @MessageBody() data: { channel_id: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.getAuthenticatedUserId(client);
    void client.leave(`room:${data.channel_id}`);
  }

  @SubscribeMessage('send:message')
  @Throttle(WEBSOCKET_RATE_LIMIT_POLICIES.sendMessage)
  async handleSendMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getAuthenticatedUserId(client);
    await this.messagesService.saveMessage(data.data, userId);
    client.emit('notify:event', {
      id: data.id,
      isSuccess: true,
    });
  }

  notifyBookAppointmentSuccess(userId: number, data: any) {
    this.server.to(`user:${userId}`).emit('appointment:success', data);

    this.server.emit('appointment:slotBooked', {
      id: data.id,
      doctor_schedule_id: data.doctor_schedule.id,
      appointment_date: data.appointment_date,
      status: data.status,
      booking_mode: data.booking_mode,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  notifyBookAppointmentFail(userId: number, message: string) {
    const socketId = this.clients.get(userId);
    if (socketId) {
      this.server.to(`user:${userId}`).emit('appointment:fail', message);
    }
  }

  notifyUpdatedFilesMessage(message: MessageResponseDto) {
    const channel_id = message.channel.id;
    this.server.to(`room:${channel_id}`).emit('updated:message:files', message);
  }

  notifyUpdatedFilesArticle(userId: number, article: Article) {
    const socketId = this.clients.get(userId);
    if (socketId) {
      this.server.to(`user:${userId}`).emit('updated:article:files', article);
    }
  }

  notifyNotificationNew(userId: number, notification: NotificationResponseDto) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  notifyNotificationUpdated(
    userId: number,
    notification: NotificationResponseDto,
  ) {
    this.server.to(`user:${userId}`).emit('notification:updated', notification);
  }

  notifyNotificationDeleted(userId: number, notificationId: number) {
    this.server
      .to(`user:${userId}`)
      .emit('notification:deleted', { id: notificationId });
  }

  notifyNotificationsReadAll(userId: number) {
    this.server
      .to(`user:${userId}`)
      .emit('notification:read-all', { unreadCount: 0 });
  }

  private getAuthenticatedUserId(client: Socket): number {
    const userId = Number(client.data?.user?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      this.rejectUnauthorizedClient(client);
      throw new WsException('Invalid token');
    }
    return userId;
  }

  private rejectUnauthorizedClient(client: Socket) {
    client.emit('ws-error', { code: 401, message: 'Invalid token' });
    client.disconnect(true);
  }

  private _extractTokenFromCookie = (client: any): string | null => {
    try {
      const cookies = client?.handshake?.headers?.cookie;
      if (!cookies) return null;
      const cookieArray = cookies.split('; ');
      const cookieMap = cookieArray.reduce((acc: any, cookie: string) => {
        const [key, value] = cookie.split('=');
        if (key && value) acc[key.trim()] = decodeURIComponent(value);
        return acc;
      }, {});
      return cookieMap['accessToken'] || null;
    } catch {
      return null;
    }
  };
}
