import { DoctorResponseDto } from './dto/response/doctorResponse.dto';
import { plainToInstance } from 'class-transformer';
import { DoctorInformationResponseDto } from './dto/response/doctorInformationResponse.dto';
import {
  DoctorOutstanding,
  DoctorOutstandingWithIsOutstanding,
} from 'src/shared/types/global.type';

export class DoctorsMapper {
  static toDoctorResponseDto(
    doctor: DoctorOutstandingWithIsOutstanding,
  ): DoctorResponseDto {
    return plainToInstance(
      DoctorResponseDto,
      { ...doctor.user, ...doctor, user_id: doctor.user.id },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  static toDoctorInformationResponseDto(
    doctor: DoctorOutstanding,
  ): DoctorInformationResponseDto {
    return plainToInstance(DoctorInformationResponseDto, doctor, {
      excludeExtraneousValues: true,
    });
  }

  static toDoctorInformationResponseDtoList(
    doctors: DoctorOutstanding[],
  ): DoctorInformationResponseDto[] {
    return plainToInstance(DoctorInformationResponseDto, doctors, {
      excludeExtraneousValues: true,
    });
  }

  static toDoctorResponseDtoList(
    doctors: DoctorOutstandingWithIsOutstanding[],
  ): DoctorResponseDto[] {
    return plainToInstance(
      DoctorResponseDto,
      doctors.map((doctor) => ({
        ...doctor.user,
        ...doctor,
        user_id: doctor.user.id,
      })),
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
