import {
  CreateGatewayOrderInput,
  CreateGatewayOrderResult,
  PaymentGateway,
  VerifyGatewayPaymentInput,
} from './payment-gateway.interface.js';

export class MockPaymentGateway implements PaymentGateway {
  async createOrder(
    input: CreateGatewayOrderInput,
  ): Promise<CreateGatewayOrderResult> {
    return {
      gateway: 'MOCK',
      gatewayOrderId: `mock_order_${input.paymentId}`,
    };
  }

  async verifyPayment(
    input: VerifyGatewayPaymentInput,
  ): Promise<boolean> {
    return (
      input.gatewayOrderId.startsWith('mock_order_') &&
      input.gatewayPaymentId.length > 0 &&
      input.gatewaySignature.length > 0
    );
  }
}