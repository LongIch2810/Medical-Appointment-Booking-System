import ExaminationResult from 'src/entities/examinationResult.entity';
import { ExaminationResultResponseDto } from './dto/response/examinationResultResponse.dto';
import { plainToInstance } from 'class-transformer';

export class ExaminationResultMapper {
  static toExaminationResultResponseDto(
    examinationResult: ExaminationResult,
  ): ExaminationResultResponseDto {
    return plainToInstance(
      ExaminationResultResponseDto,
      {
        ...examinationResult,
        appointment: {
          ...examinationResult.appointment,
          doctor: examinationResult.appointment.doctor_schedule.doctor,
        },
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  static toExaminationResultResponseDtoList(
    examinationResults: ExaminationResult[],
  ): ExaminationResultResponseDto[] {
    return plainToInstance(
      ExaminationResultResponseDto,
      examinationResults.map((examinationResult) => ({
        ...examinationResult,
        appointment: {
          ...examinationResult.appointment,
          doctor: examinationResult.appointment.doctor_schedule.doctor,
        },
      })),
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
