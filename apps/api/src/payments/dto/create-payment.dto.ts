import {
  IsEnum,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export enum CreatePaymentMethod {
  ONLINE = 'ONLINE',
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
  WALLET = 'WALLET',
}

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsEnum(CreatePaymentMethod)
  method: CreatePaymentMethod;
}