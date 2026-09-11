import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobUploadName } from 'src/shared/enums/jobUploadName';
import { UploadFileResponse } from 'src/shared/interfaces/uploadFileResponse';

/**
 * Producer chỉ enqueue job — ownership check và upload lên Cloudinary xảy
 * ra TRƯỚC khi gọi vào đây (uploads.controller.ts, ArticlesService.create),
 * không nằm trong producer. Lý do: test/production có thể hợp lệ stub hẳn
 * UploadFileProducer để tránh cần queue thật (xem test-app.factory.ts) —
 * nếu ownership check nằm trong producer, việc stub đó sẽ vô tình bỏ qua
 * luôn security check. Giữ producer "ngu" (chỉ enqueue) để nó an toàn khi
 * bị mock.
 */
@Injectable()
export class UploadFileProducer {
  constructor(
    @InjectQueue('upload-file-queue') private readonly queue: Queue,
  ) {}

  async uploadFilesMessage(data: {
    messageId: number;
    files: UploadFileResponse[];
  }) {
    await this.queue.add(JobUploadName.UPLOAD_FILES_MESSAGE, data, {
      attempts: 3, //Thử lại 3 lần,
      backoff: { type: 'exponential', delay: 2000 },
      delay: 2000, //Khi add job vào thì sau 2 giây mới bắt đầu chạy lần đầu tiên
      removeOnFail: false, // Xóa khi gặp lỗi
    });
  }

  async uploadFilesArticle(data: {
    articleId: number;
    files: UploadFileResponse[];
  }) {
    await this.queue.add(JobUploadName.UPLOAD_FILES_ARTICLE, data, {
      attempts: 3, //Thử lại 3 lần,
      backoff: { type: 'exponential', delay: 2000 },
      delay: 2000, //Khi add job vào thì sau 2 giây mới bắt đầu chạy lần đầu tiên
      removeOnFail: false, // Xóa khi gặp lỗi
    });
  }
}
