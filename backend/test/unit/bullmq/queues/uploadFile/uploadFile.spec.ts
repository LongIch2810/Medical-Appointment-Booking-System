import { FileType } from 'src/shared/enums/FileType';
import { JobUploadName } from 'src/shared/enums/jobUploadName';
import { UploadFileProcessor } from 'src/bullmq/queues/uploadFile/uploadFile.processor';
import { UploadFileProducer } from 'src/bullmq/queues/uploadFile/uploadFile.producer';

describe('upload-file queue boundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('enqueues message-file uploads (already-mapped metadata) with bounded exponential retries', async () => {
    const queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    const producer = new UploadFileProducer(queue as never);
    const files = [
      {
        url: 'https://cdn/a.png',
        type: 'IMAGE' as never,
        file_name: 'a',
        file_size: 10,
        file_extension: 'png',
        public_id: 'uploads/a',
      },
    ];

    await producer.uploadFilesMessage({ messageId: 7, files });

    expect(queue.add).toHaveBeenCalledWith(
      JobUploadName.UPLOAD_FILES_MESSAGE,
      { messageId: 7, files },
      expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        delay: 2000,
        removeOnFail: false,
      }),
    );
  });

  it('enqueues article-file uploads (already-mapped metadata) with bounded exponential retries', async () => {
    const queue = { add: jest.fn().mockResolvedValue({ id: 'job-2' }) };
    const producer = new UploadFileProducer(queue as never);
    const files = [
      {
        url: 'https://cdn/b.pdf',
        type: 'DOCUMENT' as never,
        file_name: 'b',
        file_size: 20,
        file_extension: 'pdf',
        public_id: 'uploads/b',
      },
    ];

    await producer.uploadFilesArticle({ articleId: 3, files });

    expect(queue.add).toHaveBeenCalledWith(
      JobUploadName.UPLOAD_FILES_ARTICLE,
      { articleId: 3, files },
      expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        delay: 2000,
        removeOnFail: false,
      }),
    );
  });

  it('updates the message from already-mapped job metadata and notifies via websocket (no Cloudinary call in the worker)', async () => {
    const messagesService = {
      updateFilesMessage: jest.fn().mockResolvedValue({ id: 42 }),
    };
    const articlesService = { updateFilesArticle: jest.fn() };
    const gateway = {
      notifyUpdatedFilesMessage: jest.fn(),
      notifyUpdatedFilesArticle: jest.fn(),
    };
    const processor = new UploadFileProcessor(
      messagesService as never,
      articlesService as never,
      gateway as never,
    );
    const files = [
      {
        url: 'https://cdn/1.png',
        type: FileType.IMAGE,
        file_name: '1',
        file_size: 100,
        file_extension: 'png',
        public_id: 'uploads/1',
      },
    ];

    await processor.process({
      name: JobUploadName.UPLOAD_FILES_MESSAGE,
      data: { messageId: 42, files },
    } as never);

    expect(messagesService.updateFilesMessage).toHaveBeenCalledWith(42, files);
    expect(gateway.notifyUpdatedFilesMessage).toHaveBeenCalledWith({ id: 42 });
    expect(articlesService.updateFilesArticle).not.toHaveBeenCalled();
    expect(gateway.notifyUpdatedFilesArticle).not.toHaveBeenCalled();
  });

  it('updates the article from already-mapped job metadata and notifies its author via websocket (no Cloudinary call in the worker)', async () => {
    const messagesService = { updateFilesMessage: jest.fn() };
    const articlesService = {
      updateFilesArticle: jest
        .fn()
        .mockResolvedValue({ id: 5, author: { id: 9 } }),
    };
    const gateway = {
      notifyUpdatedFilesMessage: jest.fn(),
      notifyUpdatedFilesArticle: jest.fn(),
    };
    const processor = new UploadFileProcessor(
      messagesService as never,
      articlesService as never,
      gateway as never,
    );
    const files = [
      {
        url: 'https://cdn/report.pdf',
        type: FileType.DOCUMENT,
        file_name: 'report',
        file_size: 2048,
        file_extension: 'pdf',
        public_id: 'uploads/report',
      },
    ];

    await processor.process({
      name: JobUploadName.UPLOAD_FILES_ARTICLE,
      data: { articleId: 5, files },
    } as never);

    expect(articlesService.updateFilesArticle).toHaveBeenCalledWith(5, files);
    expect(gateway.notifyUpdatedFilesArticle).toHaveBeenCalledWith(9, {
      id: 5,
      author: { id: 9 },
    });
    expect(messagesService.updateFilesMessage).not.toHaveBeenCalled();
    expect(gateway.notifyUpdatedFilesMessage).not.toHaveBeenCalled();
  });

  it('ignores unknown job names without updating anything', async () => {
    const messagesService = { updateFilesMessage: jest.fn() };
    const articlesService = { updateFilesArticle: jest.fn() };
    const gateway = {
      notifyUpdatedFilesMessage: jest.fn(),
      notifyUpdatedFilesArticle: jest.fn(),
    };
    const processor = new UploadFileProcessor(
      messagesService as never,
      articlesService as never,
      gateway as never,
    );

    await processor.process({ name: 'unknown', data: {} } as never);

    expect(messagesService.updateFilesMessage).not.toHaveBeenCalled();
    expect(articlesService.updateFilesArticle).not.toHaveBeenCalled();
  });
});
