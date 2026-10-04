import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentsService } from './payments.service.js';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto.js';
import { FailPaymentDto } from './dto/fail-payment.dto.js';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('health')
  async health() {
    return this.paymentsService.healthCheck();
  }

  @Post()
  async createPayment(
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(dto);
  }

  @Get(':id')
async getPayment(@Param('id') paymentId: string) {
  return this.paymentsService.getPayment(paymentId);
}

  @Post(':id/confirm')
async confirm(
  @Param('id') paymentId: string,
  @Body() dto: ConfirmPaymentDto,
) {
  return this.paymentsService.confirmPayment(
    paymentId,
    dto,
  );
}

@Post(':id/fail')
async fail(
  @Param('id') paymentId: string,
  @Body() dto: FailPaymentDto,
) {
  return this.paymentsService.failPayment(
    paymentId,
    dto,
  );
}
}