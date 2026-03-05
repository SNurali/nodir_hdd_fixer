import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsPhoneNumber, IsEnum, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderLanguage {
  RU = 'ru',
  UZ = 'uz',
  EN = 'en',
}

export class CreateOrderItemDto {
  @ApiProperty({ example: 'HDD', description: 'Type of equipment' })
  @IsString()
  equipment_type: string;

  @ApiProperty({ example: 'Data recovery', description: 'Issue description' })
  @IsString()
  issue_description: string;

  @ApiProperty({ example: 'Seagate 1TB', description: 'Equipment details' })
  @IsString()
  equipment_details: string;

  @ApiProperty({ example: 1, description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    enum: OrderLanguage,
    default: 'ru',
    description: 'Preferred language for communication',
  })
  @IsOptional()
  @IsEnum(OrderLanguage)
  language?: OrderLanguage;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'List of items in the order',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsArray()
  items: CreateOrderItemDto[];

  // Guest fields
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name for guest orders',
    required: false,
  })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'Phone number for contact',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email for notifications',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'Address line 1',
    description: 'Delivery or pickup address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    type: 'string',
    format: 'date',
    example: '2023-12-31',
    description: 'Desired completion date',
    required: false,
  })
  @IsOptional()
  @IsString()
  deadline?: string;
}