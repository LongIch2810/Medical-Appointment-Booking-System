import { IsArray, IsNumber } from 'class-validator';

export class BodyUpdateUserRolesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  role_ids!: number[];
}
