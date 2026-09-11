import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MessagesService } from 'src/modules/messages/messages.service';
import { JobUploadName } from 'src/shared/enums/jobUploadName';
import { UploadFileResponse } from 'src/shared/interfaces/uploadFileResponse';
import { WebsocketGateway } from 'src/websockets/websocket.gateway';
import { ArticlesService } from 'src/modules/articles/articles.service';

/**
 * Job data đã là metadata Cloudinary (url/public_id/...) do UploadFileProducer
 * upload trước khi enqueue — worker này KHÔNG bao giờ nhận buffer file thô
 * qua Redis, chỉ cập nhật DB rồi notify qua WebSocket.
 */
@Processor('upload-file-queue', {
  concurrency: 20,
})
export class UploadFileProcessor extends WorkerHost {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly articlesService: ArticlesService,
    private readonly gateway: WebsocketGateway,
  ) {
    super();
  }
  async process(job: Job): Promise<void> {
    if (job.name === String(JobUploadName.UPLOAD_FILES_MESSAGE)) {
      const { messageId, files } = job.data as {
        messageId: number;
        files: UploadFileResponse[];
      };
      const message = await this.messagesService.updateFilesMessage(
        messageId,
        files,
      );

      this.gateway.notifyUpdatedFilesMessage(message);
    } else if (job.name === String(JobUploadName.UPLOAD_FILES_ARTICLE)) {
      const { articleId, files } = job.data as {
        articleId: number;
        files: UploadFileResponse[];
      };
      const article = await this.articlesService.updateFilesArticle(
        articleId,
        files,
      );

      this.gateway.notifyUpdatedFilesArticle(article.author.id, article);
    }
  }
}
