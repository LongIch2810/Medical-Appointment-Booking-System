import { PartialType } from '@nestjs/mapped-types';
import { BodyUpdateUserDto } from './bodyUpdateUser.dto';

export class PartialUpdateUserDto extends PartialType(BodyUpdateUserDto) {}
