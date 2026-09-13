import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { AiDocumentAsset } from 'src/shared/types/aiDocumentAsset.type';
import { CloudinaryService } from 'src/uploads/cloudinary.service';

const AI_DOCUMENT_URL_TTL_SECONDS = 5 * 60;

@Injectable()
export class AiDocumentStorageService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string,
  ): Promise<AiDocumentAsset> {
    const result = await this.cloudinaryService.uploadPrivateBuffer(
      buffer,
      fileName,
      mimeType,
      folder,
    );
    return this.toAsset(result, fileName);
  }

  toAsset(
    result: UploadApiResponse,
    fallbackFileName: string,
  ): AiDocumentAsset {
    return {
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format || null,
      fileName: result.original_filename || fallbackFileName,
      bytes: result.bytes,
    };
  }

  getDownloadUrl(asset: AiDocumentAsset, attachment = false) {
    const expiresAt =
      Math.floor(Date.now() / 1000) + AI_DOCUMENT_URL_TTL_SECONDS;
    const format = asset.format || this.getFormatFromFileName(asset.fileName);
    return cloudinary.utils.private_download_url(asset.publicId, format, {
      resource_type: asset.resourceType,
      type: 'authenticated',
      expires_at: expiresAt,
      attachment,
    });
  }

  async deleteAsset(asset: AiDocumentAsset) {
    return this.cloudinaryService.deletePrivateFile(
      asset.publicId,
      asset.resourceType,
    );
  }

  async deleteAssets(assets: AiDocumentAsset[]) {
    let firstError: unknown;
    for (const asset of assets) {
      try {
        await this.deleteAsset(asset);
      } catch (error) {
        firstError ??= error;
      }
    }
    if (firstError) {
      throw firstError instanceof Error
        ? firstError
        : new Error('One or more document assets could not be deleted.');
    }
  }

  private getFormatFromFileName(fileName: string) {
    const extension = fileName.split('.').pop();
    return extension?.toLowerCase() || 'pdf';
  }
}
