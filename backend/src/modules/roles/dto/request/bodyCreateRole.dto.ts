import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, Matches, MinLength } from "class-validator";

export class BodyCreateRoleDto {
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @Matches(/^\S+$/)
    @Matches(/^[a-zA-Z][a-zA-Z_]+$/)
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    role_name!: string

    @Transform(({ value }) => typeof value === 'string' ? value.trim() : Number(value))
    @IsNumber()
    @IsNotEmpty()
    role_code!: number

    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @MinLength(20)
    description!: string
}