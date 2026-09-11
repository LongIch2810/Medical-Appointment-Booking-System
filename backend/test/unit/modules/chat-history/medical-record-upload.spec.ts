import { HttpException, PayloadTooLargeException } from '@nestjs/common';
import {
  MAX_MEDICAL_RECORD_FILE_SIZE_BYTES,
  parseMedicalRecordUpload,
} from 'src/modules/chat-history/medical-record-upload';

const file = (mimetype: string, size = 1024): Express.Multer.File =>
  ({
    originalname: 'record',
    mimetype,
    size,
    buffer: Buffer.alloc(Math.min(size, 32)),
  }) as Express.Multer.File;

describe('parseMedicalRecordUpload', () => {
  it('accepts repeated supported image files or a single PDF', () => {
    expect(
      parseMedicalRecordUpload({
        images: [file('image/png'), file('image/webp')],
      }),
    ).toMatchObject({ fieldName: 'images', files: expect.any(Array) });
    expect(
      parseMedicalRecordUpload({ pdf: [file('application/pdf')] }),
    ).toMatchObject({ fieldName: 'pdf' });
  });

  it.each([
    {},
    { images: [file('image/png')], pdf: [file('application/pdf')] },
    { images: [file('image/gif')] },
    { pdf: [file('text/plain')] },
  ])('rejects an invalid multipart combination', (fields) => {
    expect(() => parseMedicalRecordUpload(fields)).toThrow(HttpException);
  });

  it('rejects files over the 10 MB limit', () => {
    expect(() =>
      parseMedicalRecordUpload({
        images: [file('image/jpeg', MAX_MEDICAL_RECORD_FILE_SIZE_BYTES + 1)],
      }),
    ).toThrow(PayloadTooLargeException);
  });
});
