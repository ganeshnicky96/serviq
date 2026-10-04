import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class FailPaymentDto {
  @IsString()
  @IsNotEmpty()
  failureReason: string;
}