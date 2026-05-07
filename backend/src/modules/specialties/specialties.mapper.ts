import { plainToInstance } from "class-transformer";
import { SpecialtyResponseDto } from "./dto/response/specialtyResponse.dto";
import Specialty from "src/entities/specialty.entity";

export class SpecialtiesMapper {
    static toSpecialtyResponseDto(specialty: Specialty): SpecialtyResponseDto {
        return plainToInstance(SpecialtyResponseDto, specialty, {
            excludeExtraneousValues: true
        });
    }

    static toSpecialtyResponseDtoList(specialties: Specialty[]): SpecialtyResponseDto[] {
        return plainToInstance(SpecialtyResponseDto, specialties, {
            excludeExtraneousValues: true
        });
    }
}