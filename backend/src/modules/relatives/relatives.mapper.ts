import Relative from 'src/entities/relative.entity';
import { RelativeResponseDto } from './dto/response/relativeResponse.dto';
import { plainToInstance } from 'class-transformer';

export class RelativesMapper {
  static toRelativeResponseDto(relative: Relative): RelativeResponseDto {
    return plainToInstance(RelativeResponseDto, relative, {
      excludeExtraneousValues: true,
    });
  }

  static toRelativeResponseDtoList(
    relatives: Relative[],
  ): RelativeResponseDto[] {
    return plainToInstance(RelativeResponseDto, relatives, {
      excludeExtraneousValues: true,
    });
  }
}
