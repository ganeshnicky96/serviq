import { IsMobilePhone } from 'class-validator';

export class RequestOtpDto {
  @IsMobilePhone('en-IN')
  phone: string;
}