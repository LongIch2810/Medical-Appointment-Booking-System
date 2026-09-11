import { ForbiddenException } from '@nestjs/common';
import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { UploadsController } from 'src/uploads/uploads.controller';

describe('UploadsController', () => {
  const uploadFileProducer = {
    uploadFilesMessage: jest.fn(),
    uploadFilesArticle: jest.fn(),
  };
  const cloudinaryService = {
    uploadMultipleFiles: jest.fn(),
    deleteFile: jest.fn(),
  };
  const messagesService = { assertMessageSender: jest.fn() };
  const articlesService = { assertArticleUploadAccess: jest.fn() };
  const controller = new UploadsController(
    uploadFileProducer as never,
    cloudinaryService as never,
    messagesService as never,
    articlesService as never,
  );

  const uploadedMeta = [
    {
      secure_url: 'https://cdn/1.png',
      resource_type: 'image',
      original_filename: '1',
      bytes: 100,
      format: 'png',
      public_id: 'uploads/1',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    cloudinaryService.uploadMultipleFiles.mockResolvedValue(uploadedMeta);
    messagesService.assertMessageSender.mockResolvedValue(undefined);
    articlesService.assertArticleUploadAccess.mockResolvedValue(undefined);
  });

  describe('uploadFilesMessage', () => {
    it('checks sender ownership, uploads to Cloudinary, and enqueues only the mapped metadata', async () => {
      const files = [{ originalname: '1.png' }] as Express.Multer.File[];
      const req = { user: { userId: 9, roles: ['PATIENT'] } };

      const result = await controller.uploadFilesMessage(
        req as never,
        42,
        files,
      );

      expect(messagesService.assertMessageSender).toHaveBeenCalledWith(9, 42);
      expect(cloudinaryService.uploadMultipleFiles).toHaveBeenCalledWith(files);
      expect(uploadFileProducer.uploadFilesMessage).toHaveBeenCalledWith({
        messageId: 42,
        files: [
          {
            url: 'https://cdn/1.png',
            type: 'IMAGE',
            file_name: '1',
            file_size: 100,
            file_extension: 'png',
            public_id: 'uploads/1',
          },
        ],
      });
      expect(result).toEqual({ message: 'upload files message' });
    });

    it("rejects and never touches Cloudinary when the caller isn't the message sender (IDOR)", async () => {
      messagesService.assertMessageSender.mockRejectedValue(
        new ForbiddenException(),
      );
      const files = [{ originalname: '1.png' }] as Express.Multer.File[];
      const req = { user: { userId: 9, roles: ['PATIENT'] } };

      await expect(
        controller.uploadFilesMessage(req as never, 42, files),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(cloudinaryService.uploadMultipleFiles).not.toHaveBeenCalled();
      expect(uploadFileProducer.uploadFilesMessage).not.toHaveBeenCalled();
    });

    it('cleans up the uploaded Cloudinary files if enqueueing fails', async () => {
      uploadFileProducer.uploadFilesMessage.mockRejectedValue(
        new Error('queue down'),
      );
      const files = [{ originalname: '1.png' }] as Express.Multer.File[];
      const req = { user: { userId: 9, roles: ['PATIENT'] } };

      await expect(
        controller.uploadFilesMessage(req as never, 42, files),
      ).rejects.toThrow('queue down');
      expect(cloudinaryService.deleteFile).toHaveBeenCalledWith('uploads/1');
    });
  });

  describe('uploadFilesArticle', () => {
    it('checks author ownership, uploads to Cloudinary, and enqueues only the mapped metadata', async () => {
      const files = [{ originalname: 'report.pdf' }] as Express.Multer.File[];
      const req = { user: { userId: 9, roles: ['DOCTOR'] } };
      cloudinaryService.uploadMultipleFiles.mockResolvedValue([
        {
          secure_url: 'https://cdn/report.pdf',
          resource_type: 'raw',
          original_filename: 'report',
          bytes: 2048,
          format: 'pdf',
          public_id: 'uploads/report',
        },
      ]);

      const result = await controller.uploadFilesArticle(
        req as never,
        4,
        files,
      );

      expect(articlesService.assertArticleUploadAccess).toHaveBeenCalledWith(
        9,
        ['DOCTOR'],
        4,
      );
      expect(uploadFileProducer.uploadFilesArticle).toHaveBeenCalledWith({
        articleId: 4,
        files: [
          {
            url: 'https://cdn/report.pdf',
            type: 'DOCUMENT',
            file_name: 'report',
            file_size: 2048,
            file_extension: 'pdf',
            public_id: 'uploads/report',
          },
        ],
      });
      expect(result).toEqual({ message: 'upload files article' });
    });

    it("rejects and never touches Cloudinary when the caller isn't the article's author or a manager (IDOR)", async () => {
      articlesService.assertArticleUploadAccess.mockRejectedValue(
        new ForbiddenException(),
      );
      const files = [{ originalname: 'x.png' }] as Express.Multer.File[];
      const req = { user: { userId: 9, roles: ['PATIENT'] } };

      await expect(
        controller.uploadFilesArticle(req as never, 4, files),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(cloudinaryService.uploadMultipleFiles).not.toHaveBeenCalled();
      expect(uploadFileProducer.uploadFilesArticle).not.toHaveBeenCalled();
    });
  });

  it.each([
    ['uploadFilesMessage', PERMISSIONS.MESSAGE_CREATE],
    ['uploadFilesArticle', PERMISSIONS.ARTICLE_CREATE],
  ] as const)('requires %s permission for %s', (method, permission) => {
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, UploadsController.prototype[method]),
    ).toEqual([permission]);
  });
});
