import { CloudinaryService } from 'src/uploads/cloudinary.service';

describe('CloudinaryService', () => {
  let callback: (error: unknown, result?: unknown) => void;
  let stream: { end: jest.Mock };
  let cdn: any;
  let service: CloudinaryService;

  beforeEach(() => {
    stream = { end: jest.fn() };
    cdn = {
      uploader: {
        upload_stream: jest.fn((options, next) => {
          callback = next;
          return stream;
        }),
        destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
      },
    };
    service = new CloudinaryService(cdn);
  });

  it('streams a file buffer using automatic resource detection', async () => {
    const pending = service.uploadFile({
      buffer: Buffer.from('image'),
    } as never);
    callback(null, { public_id: 'uploads/scan' });

    await expect(pending).resolves.toMatchObject({ public_id: 'uploads/scan' });
    expect(cdn.uploader.upload_stream).toHaveBeenCalledWith(
      { resource_type: 'auto', folder: 'uploads' },
      expect.any(Function),
    );
    expect(stream.end).toHaveBeenCalledWith(Buffer.from('image'));
  });

  it('rejects provider errors and missing provider results', async () => {
    const providerFailure = service.uploadFile({
      buffer: Buffer.from('a'),
    } as never);
    callback(new Error('provider unavailable'));
    await expect(providerFailure).rejects.toThrow('provider unavailable');

    const emptyResult = service.uploadFile({
      buffer: Buffer.from('b'),
    } as never);
    callback(null, undefined);
    await expect(emptyResult).rejects.toThrow('Upload failed');
  });

  it('normalizes serialized buffers before parallel upload', async () => {
    const upload = jest
      .spyOn(service, 'uploadFile')
      .mockResolvedValue({ secure_url: 'url' } as never);
    const serializedBuffer = { type: 'Buffer', data: [1, 2, 3] };
    const files = [
      { buffer: serializedBuffer },
      { buffer: Buffer.from([4]) },
    ] as never;

    await expect(service.uploadMultipleFiles(files)).resolves.toHaveLength(2);
    expect(upload).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ buffer: Buffer.from([1, 2, 3]) }),
    );
  });

  it('delegates deletion by public id', async () => {
    await expect(service.deleteFile('uploads/scan')).resolves.toEqual({
      result: 'ok',
    });
    expect(cdn.uploader.destroy).toHaveBeenCalledWith('uploads/scan');
  });
});
