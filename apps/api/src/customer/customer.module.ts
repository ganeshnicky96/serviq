import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller.js';
import { CustomerService } from './customer.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { BookingsModule } from '../bookings/bookings.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { TrackingModule } from '../tracking/tracking.module.js';
import { InvoicesModule } from '../invoices/invoices.module.js';

@Module({
  imports: [AuthModule, BookingsModule, PaymentsModule, TrackingModule,  InvoicesModule,],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}