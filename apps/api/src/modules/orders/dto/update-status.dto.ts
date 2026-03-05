import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min, Max, IsUUID } from 'class-validator';

export enum OrderStatus {
  NEW = 'new',
  ASSIGNED = 'assigned',
  DIAGNOSING = 'diagnosing',
  AWAITING_APPROVAL = 'awaiting_approval',
  APPROVED = 'approved',
  IN_REPAIR = 'in_repair',
  READY_FOR_PICKUP = 'ready_for_pickup',
  ISSUED = 'issued',
  CANCELLED = 'cancelled',
  UNREPAIRABLE = 'unrepairable',
}

export class UpdateStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    description: 'New status for the order',
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({
    required: false,
    description: 'Reason for status change',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    required: false,
    description: 'Diagnostics report (required for diagnostics status)',
  })
  @IsOptional()
  @IsString()
  diagnostics_report?: string;

  @ApiProperty({
    required: false,
    description: 'Estimated price (required for awaiting_approval status)',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated_price?: number;

  @ApiProperty({
    required: false,
    description: 'Estimated days (required for awaiting_approval status)',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  estimated_days?: number;

  @ApiProperty({
    required: false,
    description: 'Master ID to assign (for assigning master)',
  })
  @IsOptional()
  @IsUUID()
  master_id?: string;
}
