import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdateLocationDto {
  @IsUUID()
  partnerId: string;

  @IsOptional()
  @IsUUID()
  jobId?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;
}