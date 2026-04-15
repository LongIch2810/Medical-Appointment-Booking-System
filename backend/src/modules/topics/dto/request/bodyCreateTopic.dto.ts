import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class BodyCreateTopicDto {
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    name!: string;

    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsNotEmpty()
    @IsString()
    @MinLength(10)
    description!: string
}