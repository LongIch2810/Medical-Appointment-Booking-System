import CoachProfile from 'src/entities/coachProfile.entity';
import { CoachProfileResponseDto } from './dto/response/coachProfileResponse.dto';
import { plainToInstance } from 'class-transformer';

export class CoachProfileMapper {
  static toCoachProfileResponseDto(
    coachProfile: CoachProfile,
  ): CoachProfileResponseDto {
    return plainToInstance(CoachProfileResponseDto, coachProfile, {
      excludeExtraneousValues: true,
    });
  }
}
