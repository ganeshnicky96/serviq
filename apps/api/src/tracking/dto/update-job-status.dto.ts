import { IsEnum } from 'class-validator';

export enum TrackingJobStatus {
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class UpdateJobStatusDto {
  @IsEnum(TrackingJobStatus)
  status: TrackingJobStatus;
}