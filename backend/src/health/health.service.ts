import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const SELF_PING_TIMEOUT_MS = 5_000;

// Render free plan cho web service ngủ sau ~15 phút không có request đến
// từ bên ngoài (qua ingress công khai — loopback/localhost không tính).
// Tự gọi ra chính URL công khai của mình mỗi 10 phút để request đó đi ra
// internet rồi quay lại qua ingress, được Render tính là traffic thật,
// nhờ vậy service không bao giờ chạm ngưỡng 15 phút bất hoạt.
// RENDER_EXTERNAL_URL do Render tự inject cho mọi service — không có ở
// local/dev nên tự bỏ qua khi chạy ngoài Render.
@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async pingSelfKeepAlive() {
    const selfUrl = this.configService.get<string>('RENDER_EXTERNAL_URL');
    if (!selfUrl) return;

    try {
      await axios.get(`${selfUrl}/healthy`, {
        timeout: SELF_PING_TIMEOUT_MS,
      });
    } catch (error: any) {
      console.error('Self keep-alive ping failed:', {
        status: error?.response?.status,
        code: error?.code,
      });
    }
  }
}
