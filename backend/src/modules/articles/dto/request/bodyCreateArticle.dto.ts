import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class BodyCreateArticleDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @MinLength(10, { message: 'Tiêu đề phải có ít nhất 10 ký tự' })
  @MaxLength(200, { message: 'Tiêu đề không được vượt quá 200 ký tự' })
  title!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @IsString({ message: 'Nội dung phải là chuỗi' })
  @MinLength(200, { message: 'Nội dung phải có ít nhất 200 ký tự' })
  content!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @IsNotEmpty()
  @MinLength(30, { message: 'Tóm tắt phải có ít nhất 30 ký tự' })
  @MaxLength(500, { message: 'Tóm tắt không được vượt quá 500 ký tự' })
  summary!: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    try {
      const parsed = JSON.parse(value);

      if (!Array.isArray(parsed)) return parsed;

      const parsedSet = [...new Set(parsed)];

      return parsedSet
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id));
    } catch {
      return value;
    }
  })
  @IsArray({ message: 'Tags phải là mảng' })
  @ArrayMaxSize(10, { message: 'Không được có quá 10 tags' })
  @IsNumber({}, { each: true, message: 'Mỗi tag_id phải là số' })
  tag_ids!: number[];

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  topic_id!: number;
}
