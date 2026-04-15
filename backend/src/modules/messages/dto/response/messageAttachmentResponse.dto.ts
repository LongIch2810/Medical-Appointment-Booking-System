import { Exclude, Expose, Type } from 'class-transformer';
import { MessageResponseDto } from './messageResponse.dto';
import { FileType } from 'src/shared/enums/FileType';

@Exclude()
export class MessageAttachmentResponseDto {
  @Expose()
  id!: number;

  @Expose()
  url!: string;

  @Expose()
  type!: FileType;

  @Expose()
  file_name!: string;

  @Expose()
  file_size!: number;

  @Expose()
  file_extension!: string;

  @Expose()
  public_id!: string;
}
