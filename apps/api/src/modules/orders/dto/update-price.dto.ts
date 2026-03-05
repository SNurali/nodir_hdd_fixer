import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class UpdatePriceDto {
  @ApiProperty({ 
    example: 450000, 
    description: 'New price for the order', 
    minimum: 0 
  })
  @IsNumber()
  @Min(0)
  new_price: number;

  @ApiProperty({ 
    example: 'Additional diagnostic required', 
    description: 'Reason for price change',
    required: false 
  })
  @IsOptional()
  @IsString()
  reason?: string;
}