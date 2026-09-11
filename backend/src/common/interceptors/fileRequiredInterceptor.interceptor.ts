import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { MAX_UPLOAD_FILE_SIZE_BYTES } from 'src/utils/constants';

@Injectable()
export class FileRequiredInterceptor implements NestInterceptor {
  constructor(
    private readonly allowedMimeTypes: string[] = [
      // images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',

      // videos
      'video/mp4',
      'video/mpeg',
      'video/webm',
      'video/ogg',
      'video/quicktime',

      // documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ],
    private readonly maxFileSize: number = MAX_UPLOAD_FILE_SIZE_BYTES,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const file = request.file;
    const files = request.files;
    if (!file && (!files || files.length === 0)) {
      throw new BadRequestException('No file provided!');
    }

    if (file) {
      this.validateFile(file);
    }

    if (files && Array.isArray(files)) {
      files.forEach((file) => this.validateFile(file));
    }

    return next.handle();
  }

  private validateFile(file: Express.Multer.File) {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }
  }
}
