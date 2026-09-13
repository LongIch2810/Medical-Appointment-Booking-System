import { Inject, Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cdn: typeof cloudinary) {}

  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = this.cdn.uploader.upload_stream(
        { resource_type: 'auto', folder: 'uploads' },
        (err, result) => {
          if (err || !result) {
            return reject(
              err instanceof Error ? err : new Error('Upload failed'),
            );
          }
          resolve(result);
        },
      );
      stream.end(file.buffer);
    });
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
  ): Promise<UploadApiResponse[]> {
    const normalizedFiles = files.map((file) => {
      if (file.buffer && !(file.buffer instanceof Buffer)) {
        file.buffer = Buffer.from((file.buffer as any).data); // 👈 chuyển object → Buffer
      }
      return file;
    });

    const uploadPromises = normalizedFiles.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  async deleteFile(publicId: string) {
    return this.cdn.uploader.destroy(publicId);
  }

  async uploadPrivateBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string,
  ): Promise<UploadApiResponse> {
    const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';
    const format = fileName.split('.').pop()?.toLowerCase();

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = this.cdn.uploader.upload_stream(
        {
          resource_type: resourceType,
          type: 'authenticated',
          folder,
          format,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (err, result) => {
          if (err || !result) {
            return reject(
              err instanceof Error ? err : new Error('Private upload failed'),
            );
          }
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  }

  async deletePrivateFile(publicId: string, resourceType: string) {
    return this.cdn.uploader.destroy(publicId, {
      resource_type: resourceType as 'image' | 'raw' | 'video',
      type: 'authenticated',
    });
  }
}
