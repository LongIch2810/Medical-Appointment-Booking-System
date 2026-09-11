import { ArrayMinSize, ArrayUnique, IsInt, IsPositive } from 'class-validator';

export class CreateChannelDto {
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayMinSize(2, { message: 'Kênh trò chuyện cần ít nhất 2 người tham gia.' })
  @ArrayUnique()
  member_ids!: number[];
}
