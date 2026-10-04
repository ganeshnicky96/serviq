import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ConfirmPaymentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  gatewayPaymentId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  gatewaySignature?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  gatewayReference?: string;
}