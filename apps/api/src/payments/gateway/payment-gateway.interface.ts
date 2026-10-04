export interface CreateGatewayOrderInput {
  paymentId: string;
  amount: string;
  currency: string;
}

export interface CreateGatewayOrderResult {
  gateway: string;
  gatewayOrderId: string;
}

export interface VerifyGatewayPaymentInput {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
}

export interface PaymentGateway {
  createOrder(
    input: CreateGatewayOrderInput,
  ): Promise<CreateGatewayOrderResult>;

  verifyPayment(
    input: VerifyGatewayPaymentInput,
  ): Promise<boolean>;
}