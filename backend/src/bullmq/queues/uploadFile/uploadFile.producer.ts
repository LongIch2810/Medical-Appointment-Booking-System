import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobUploadName } from 'src/shared/enums/jobUploadName';

@Injectable()
export class UploadFileProducer {
  constructor(
    @InjectQueue('upload-file-queue') private readonly queue: Queue,
  ) { }

  async uploadFilesMessage(data: {
    messageId: number;
    files: Express.Multer.File[];
  }) {
    console.log('>>> files', data.files);
    await this.queue.add(JobUploadName.UPLOAD_FILES_MESSAGE, data, {
      attempts: 3, //Thử lại 3 lần,
      backoff: { type: 'exponential', delay: 2000 },
      delay: 2000, //Khi add job vào thì sau 2 giây mới bắt đầu chạy lần đầu tiên
      removeOnFail: false, // Xóa khi gặp lỗi
    });
  }

  async uploadFilesArticle(data: {
    articleId: number;
    files: Express.Multer.File[];
  }) {
    console.log('>>> files', data.files);
    await this.queue.add(JobUploadName.UPLOAD_FILES_ARTICLE, data, {
      attempts: 3, //Thử lại 3 lần,
      backoff: { type: 'exponential', delay: 2000 },
      delay: 2000, //Khi add job vào thì sau 2 giây mới bắt đầu chạy lần đầu tiên
      removeOnFail: false, // Xóa khi gặp lỗi
    })
  }
}
