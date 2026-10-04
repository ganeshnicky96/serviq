import { IsUUID } from 'class-validator';

export class GetJobLocationDto {
  @IsUUID()
  jobId: string;
}