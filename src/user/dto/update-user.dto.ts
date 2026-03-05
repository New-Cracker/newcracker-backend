import { PartialType } from '@nestjs/mapped-types';
import { SignupDto } from './signup-request.dto';

export class UpdateUserDto extends PartialType(SignupDto) {}
