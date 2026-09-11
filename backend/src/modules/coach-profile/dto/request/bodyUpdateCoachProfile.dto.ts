import { PartialType } from '@nestjs/mapped-types';
import { BodyCreateCoachProfileDto } from './bodyCreateCoachProfile.dto';

export class BodyUpdateCoachProfileDto extends PartialType(
  BodyCreateCoachProfileDto,
) {}
