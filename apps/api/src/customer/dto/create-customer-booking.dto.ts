import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateCustomerBookingDto {
  @IsUUID()
  serviceId: string;

  @IsUUID()
  addressId: string;

  @IsInt()
  @Min(1)
  quantity: number = 1;
}