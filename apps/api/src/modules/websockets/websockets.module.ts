import { Module } from '@nestjs/common';
import { WebsocketsGateway } from './websockets.gateway';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  providers: [WebsocketsGateway],
  exports: [WebsocketsGateway],
})
export class WebsocketsModule {}