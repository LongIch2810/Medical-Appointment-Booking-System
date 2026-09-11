import { UploadApiResponse } from 'cloudinary';
import { UploadFileResponse } from 'src/shared/interfaces/uploadFileResponse';
import { mapFileType } from '../utils/mapFileType';

/** Chuẩn hoá kết quả Cloudinary thành metadata nhỏ gọn — đây là thứ DUY
 * NHẤT được đưa vào BullMQ/Redis, không bao giờ là buffer file gốc. */
export function mapCloudinaryUploadResults(
  results: UploadApiResponse[],
): UploadFileResponse[] {
  return results.map((item) => ({
    url: item.secure_url,
    type: mapFileType(item.resource_type),
    file_name: item.original_filename,
    file_size: item.bytes,
    file_extension: item.format,
    public_id: item.public_id,
  }));
}
