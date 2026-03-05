import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class EstimateItemDto {
  @ApiProperty({ example: '1', description: 'Order detail ID' })
  @IsString()
  detail_id: string;

  @ApiProperty({ example: 500000, description: 'Estimated price for this item' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'Detailed description', description: 'Description of the work' })
  @IsString()
  description: string;
}

export class ProposeEstimateDto {
  @ApiProperty({
    type: [EstimateItemDto],
    description: 'List of items with estimated prices',
  })
  @ValidateNested({ each: true })
  @Type(() => EstimateItemDto)
  @IsArray()
  items: EstimateItemDto[];

  @ApiProperty({
    example: 'Complete diagnostic report...',
    description: 'Full diagnostic report',
  })
  @IsString()
  diagnostics_report: string;

  @ApiProperty({
    example: 3,
    description: 'Estimated number of days to complete',
    minimum: 1,
    maximum: 365,
  })
  @IsNumber()
  @Min(1)
  @Max(365)
  estimated_days: number;

  @ApiProperty({
    example: false,
    description: 'Whether the device is unrepairable',
  })
  @IsBoolean()
  is_unrepairable?: boolean;
}