import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { InvoicesService } from './invoices.service.js';
import { InvoicePdfService } from './pdf/invoice-pdf.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  @Get('health')
  async healthCheck() {
    return this.invoicesService.healthCheck();
  }

  @Post('booking/:bookingId/generate')
  async generateInvoice(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    return this.invoicesService.generateInvoice(
      bookingId,
      user.sub,
    );
  }

  @Get(':id/pdf')
  async downloadInvoicePdf(
    @Param('id') invoiceId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const invoice =
      await this.invoicesService.getInvoice(
        invoiceId,
        user.sub,
      );

    const pdf =
      await this.invoicePdfService.generateInvoicePdf(
        invoice,
      );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdf.length,
    });

    res.send(pdf);
  }

  @Get(':id')
  async getInvoice(
    @Param('id') invoiceId: string,
    @CurrentUser() user: any,
  ) {
    return this.invoicesService.getInvoice(
      invoiceId,
      user.sub,
    );
  }
}