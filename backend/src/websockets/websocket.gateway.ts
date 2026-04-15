import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketServer,
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Article from 'src/entities/article.entity';

import Message from 'src/entities/message.entity';
import { ChatHistoryService } from 'src/modules/chat-history/chat-history.service';
import { BodyCreateMessageDto } from 'src/modules/messages/dto/request/bodyCreateMessage.dto';
import { MessagesService } from 'src/modules/messages/messages.service';
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private messagesService: MessagesService,
    private chatHistoryService: ChatHistoryService,
    private jwtService: JwtService,
  ) {}

  @WebSocketServer()
  server: Server;

  private clients = new Map<number, string>();

  handleConnection(client: Socket) {
    const token = this._extractTokenFromCookie(client);
    console.log('>>> token: ', token);
    if (!token) {
      client.emit('ws-error', { code: 401, message: 'Invalid token' });
      return false;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_SECRET || 'secret',
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
      client.emit('ws-error', { code: 401, message: 'Invalid token' });
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
  handleJoinChannel(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`room:${data.data.channel_id}`);
    this.server.to(`user:${data.data.userId}`).emit('notify:event', {
      id: data.id,
      isSuccess: true,
    });
  }

  @SubscribeMessage('send:message')
  async handleSendMessage(@MessageBody() data: any) {
    const message = await this.messagesService.saveMessage(data.data);
    this.server
      .to(`room:${data.data.channel_id}`)
      .emit(`receive:message`, message);
    this.server.to(`user:${data.data.userId}`).emit('notify:event', {
      id: data.id,
      isSuccess: true,
    });
  }

  @SubscribeMessage('send:message:chatbot')
  async handleSendMessageChatbot(
    @MessageBody() data,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log('>>> client.data: ', client.data);
      console.log('>>> data : ', data);
      const token = client.data.token;
      const dataAnswer = await this.chatHistoryService.chatbotAnswer(
        data.data.userId,
        data.data.question,
        token,
      );
      console.log('>>> dataAnswer : ', dataAnswer);
      this.server
        .to(`user:${data.data.userId}`)
        .emit('receive:message:chatbot', dataAnswer);
      this.server.to(`user:${data.data.userId}`).emit('notify:event', {
        id: data.id,
        isSuccess: true,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        client.emit('ws-error', { code: 401, message: 'Unauthorized' });
        return;
      }

      console.error('🔥 Chatbot error:', error);
      client.emit('ws-error', {
        code: 500,
        message: 'Internal server error',
        eventId: data.id,
      });
    }
  }

  notifyBookAppointmentSuccess(userId: number, data: any) {
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
      deleted_at: data.deleted_at,
    });
  }

  notifyBookAppointmentFail(userId: number, message: string) {
    const socketId = this.clients.get(userId);
    if (socketId) {
      this.server.to(`user:${userId}`).emit('appointment:fail', message);
    }
  }

  notifyUpdatedFilesMessage(message: Message) {
    const channel_id = message.channel.id;
    this.server.to(`room:${channel_id}`).emit('updated:message:files', message);
  }

  notifyUpdatedFilesArticle(userId: number, article: Article) {
    const socketId = this.clients.get(userId);
    if (socketId) {
      this.server.to(`user:${userId}`).emit('updated:article:files', article);
    }
  }

  private _extractTokenFromCookie = (client: any): string | null => {
    try {
      const cookies = client?.handshake?.headers?.cookie;
      if (!cookies) return null;
      const cookieArray = cookies.split('; ');
      console.log('>>> cookieArray : ', cookieArray);
      const cookieMap = cookieArray.reduce((acc: any, cookie: string) => {
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
