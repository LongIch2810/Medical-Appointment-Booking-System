import { Exclude, Expose, Transform, Type } from "class-transformer";
import { SpecialtyResponseDto } from "src/modules/specialties/dto/response/specialtyResponse.dto";
import { UserResponseDto } from "src/modules/users/dto/response/userResponse.dto";
import { DoctorLevel } from "src/shared/enums/doctorLevel";

@Exclude()
export class DoctorInformationResponseDto {
    @Expose()
    id!: number;

    @Expose()
    @Type(() => UserResponseDto)
    user!: UserResponseDto;

    @Expose()
    experience!: number;

    @Expose()
    about_me!: string;

    @Expose()
    workplace!: string;

    @Expose()
    doctor_level!: DoctorLevel;

    @Expose()
    @Type(() => SpecialtyResponseDto)
    specialty!: SpecialtyResponseDto;
}