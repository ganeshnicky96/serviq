import { Body, Controller, Get, Post, UseGuards, Param } from '@nestjs/common';
import { CustomerService } from './customer.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateCustomerBookingDto } from './dto/create-customer-booking.dto.js';
import { CreatePaymentMethod } from '../payments/dto/create-payment.dto.js';

@Controller('customer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CUSTOMER')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
  ) {}

  @Get('profile')
  async getProfile(
    @CurrentUser() user: any,
  ) {
    return this.customerService.getCustomerProfile(
      user.sub,
    );
  }

  @Get('services')
    async getServices() {
  return this.customerService.getServices();
}

@Get('addresses')
async getAddresses(@CurrentUser() user: any) {
  return this.customerService.getCustomerAddresses(user.sub);
}

@Post('bookings')
async createBooking(
  @Body() dto: CreateCustomerBookingDto,
  @CurrentUser() user: any,
) {
  return this.customerService.createCustomerBooking(
    user.sub,
    dto.serviceId,
    dto.addressId,
    dto.quantity,
  );
}

@Post('payments')
async createPayment(
  @Body() body: { bookingId: string; method: CreatePaymentMethod },
  @CurrentUser() user: any,
) {
  return this.customerService.createCustomerPayment(
    user.sub,
    body.bookingId,
    body.method,
  );
}

@Post('payments/confirm')
async confirmPayment(
  @Body()
  body: {
    paymentId: string;
    gatewayPaymentId: string;
    gatewaySignature: string;
    gatewayReference?: string;
  },
  @CurrentUser() user: any,
) {
  return this.customerService.confirmCustomerPayment(
    user.sub,
    body.paymentId,
    body.gatewayPaymentId,
    body.gatewaySignature,
    body.gatewayReference,
  );
}

@Get('bookings/:bookingId')
async getBooking(
  @Param('bookingId') bookingId: string,
  @CurrentUser() user: any,
) {
  return this.customerService.getCustomerBooking(
    user.sub,
    bookingId,
  );
}

@Get('bookings')
async getBookings(@CurrentUser() user: any) {
  return this.customerService.getCustomerBookings(user.sub);
}

@Get('bookings/:bookingId/location')
async getBookingLocation(
  @Param('bookingId') bookingId: string,
  @CurrentUser() user: any,
) {
  return this.customerService.getCustomerBookingLocation(
    user.sub,
    bookingId,
  );
}

@Get('bookings/:bookingId/distance')
async getBookingDistance(
  @Param('bookingId') bookingId: string,
  @CurrentUser() user: any,
) {
  return this.customerService.getCustomerBookingDistance(
    user.sub,
    bookingId,
  );
}

@Get('bookings/:bookingId/invoice')
async getBookingInvoice(
  @Param('bookingId') bookingId: string,
  @CurrentUser() user: any,
) {
  return this.customerService.getCustomerBookingInvoice(
    user.sub,
    bookingId,
  );
}

@Post('addresses/:addressId/location')
async updateAddressLocation(
  @Param('addressId') addressId: string,
  @Body() body: { latitude: number; longitude: number },
  @CurrentUser() user: any,
) {
  return this.customerService.updateCustomerAddressLocation(
    user.sub,
    addressId,
    body.latitude,
    body.longitude,
  );
}
}