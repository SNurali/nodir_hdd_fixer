import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class ClickWebhookDto {
  @ApiProperty({ example: '12345', description: 'Click merchant ID' })
  @IsString()
  merchant_id: string;

  @ApiProperty({ example: 'service123', description: 'Service ID' })
  @IsString()
  service_id: string;

  @ApiProperty({ example: '100000', description: 'Amount in tiyns' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'ORDER_12345', description: 'Transaction parameter' })
  @IsString()
  transaction_param: string;

  @ApiProperty({ example: '2023-01-01 12:00:00', description: 'Signature time' })
  @IsString()
  sign_time: string;

  @ApiProperty({ example: 'SIGNATURE_HASH', description: 'Signature hash' })
  @IsString()
  sign: string;

  @ApiProperty({ example: '1', description: 'Status (1 - success, 0 - fail)' })
  @IsString()
  status: string;

  @ApiProperty({ example: '1234567890', description: 'Click transaction ID', required: false })
  @IsOptional()
  @IsString()
  click_trans_id?: string;
}

export class PaymeWebhookDto {
  @ApiProperty({ example: 'PerformTransaction', description: 'Method name' })
  @IsString()
  @IsIn(['CheckTransaction', 'PerformTransaction', 'CancelTransaction'])
  method: string;

  @ApiProperty({ description: 'Parameters object' })
  @IsNotEmpty()
  params: {
    id?: string;
    amount?: number;
    account?: {
      order_id: string;
    };
  };
}