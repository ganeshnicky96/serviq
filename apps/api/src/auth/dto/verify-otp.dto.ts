import { IsMobilePhone, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsMobilePhone('en-IN')
  phone: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}