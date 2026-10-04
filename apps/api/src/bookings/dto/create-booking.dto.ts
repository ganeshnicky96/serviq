import { IsISO8601, IsOptional, IsString, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  customerId!: string;

  @IsUUID()
  serviceId!: string;

  @IsUUID()
  addressId!: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}
