import HealthProfile from 'src/entities/healthProfile.entity';
import { HealthProfileResponseDto } from './dto/response/healthProfileResponse.dto';
import { plainToInstance } from 'class-transformer';

export class HealthProfileMapper {
  static toHealthProfileResponseDto(
    healthProfile: HealthProfile,
  ): HealthProfileResponseDto {
    return plainToInstance(HealthProfileResponseDto, healthProfile, {
      excludeExtraneousValues: true,
    });
  }

  static toHealthProfileResponseDtoList(
    healthProfiles: HealthProfile[],
  ): HealthProfileResponseDto[] {
    return plainToInstance(HealthProfileResponseDto, healthProfiles, {
      excludeExtraneousValues: true,
    });
  }
}
