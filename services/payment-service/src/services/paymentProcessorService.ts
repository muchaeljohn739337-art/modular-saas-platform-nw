import Stripe from 'stripe';
import { logger } from '../utils/logger';

interface PaymentDetails {
  paymentId: string;
  amount: number;
  method: string;
  paymentDetails?: any;
  customerInfo: {
    name: string;
    email: string;
  };
  invoiceInfo: {
    invoiceNumber: string;
    description: string;
  };
}

interface ProcessorResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class PaymentProcessorService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16'
    });
  }

  async processPayment(paymentDetails: PaymentDetails): Promise<ProcessorResponse> {
    try {
      switch (paymentDetails.method) {
        case 'CREDIT_CARD':
        case 'DEBIT_CARD':
          return await this.processCardPayment(paymentDetails);
        
        case 'ACH_TRANSFER':
          return await this.processACHPayment(paymentDetails);
        
        case 'HEALTH_SAVINGS_ACCOUNT':
        case 'FLEXIBLE_SPENDING_ACCOUNT':
          return await this.processHSAPayment(paymentDetails);
        
        default:
          return { success: false, error: 'Unsupported payment method' };
      }
    } catch (error) {
      logger.error('Payment processing error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment processing failed' 
      };
    }
  }

  private async processCardPayment(paymentDetails: PaymentDetails): Promise<ProcessorResponse> {
    try {
      // Create or retrieve customer
      const customer = await this.stripe.customers.create({
        email: paymentDetails.customerInfo.email,
        name: paymentDetails.customerInfo.name,
        metadata: {
          paymentId: paymentDetails.paymentId
        }
      });

      // Create payment method
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          token: paymentDetails.paymentDetails?.cardToken // In production, you'd use tokenized card data
        },
        billing_details: {
          name: paymentDetails.customerInfo.name,
          email: paymentDetails.customerInfo.email
        }
      });

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentDetails.amount * 100), // Convert to cents
        currency: 'usd',
        customer: customer.id,
        payment_method: paymentMethod.id,
        confirmation_method: 'manual',
        confirm: true,
        description: paymentDetails.invoiceInfo.description,
        metadata: {
          paymentId: paymentDetails.paymentId,
          invoiceNumber: paymentDetails.invoiceInfo.invoiceNumber
        }
      });

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          data: {
            stripePaymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            charges: paymentIntent.charges.data
          }
        };
      } else if (paymentIntent.status === 'requires_action') {
        return {
          success: true,
          data: {
            stripePaymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            clientSecret: paymentIntent.client_secret,
            nextAction: paymentIntent.next_action
          }
        };
      } else {
        return {
          success: false,
          error: `Payment failed with status: ${paymentIntent.status}`
        };
      }
    } catch (error) {
      logger.error('Card payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Card payment failed'
      };
    }
  }

  private async processACHPayment(paymentDetails: PaymentDetails): Promise<ProcessorResponse> {
    try {
      // Create customer
      const customer = await this.stripe.customers.create({
        email: paymentDetails.customerInfo.email,
        name: paymentDetails.customerInfo.name,
        metadata: {
          paymentId: paymentDetails.paymentId
        }
      });

      // Create bank account token (in production, you'd use Stripe.js to create this)
      const bankAccountToken = paymentDetails.paymentDetails?.bankAccountToken;

      // Create bank account
      const bankAccount = await this.stripe.customers.createSource(customer.id, {
        source: bankAccountToken
      });

      // Create charge for ACH
      const charge = await this.stripe.charges.create({
        amount: Math.round(paymentDetails.amount * 100),
        currency: 'usd',
        customer: customer.id,
        source: bankAccount.id,
        description: paymentDetails.invoiceInfo.description,
        metadata: {
          paymentId: paymentDetails.paymentId,
          invoiceNumber: paymentDetails.invoiceInfo.invoiceNumber
        }
      });

      if (charge.status === 'succeeded') {
        return {
          success: true,
          data: {
            stripeChargeId: charge.id,
            status: charge.status,
            amount: charge.amount
          }
        };
      } else if (charge.status === 'pending') {
        return {
          success: true,
          data: {
            stripeChargeId: charge.id,
            status: charge.status,
            message: 'ACH payment is being processed'
          }
        };
      } else {
        return {
          success: false,
          error: `ACH payment failed with status: ${charge.status}`
        };
      }
    } catch (error) {
      logger.error('ACH payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ACH payment failed'
      };
    }
  }

  private async processHSAPayment(paymentDetails: PaymentDetails): Promise<ProcessorResponse> {
    try {
      // HSA/FSA cards are processed similarly to regular cards
      // but with special verification requirements
      const result = await this.processCardPayment(paymentDetails);
      
      if (result.success) {
        // Add HSA-specific metadata
        result.data = {
          ...result.data,
          paymentType: 'HSA_FSA',
          verified: true
        };
      }
      
      return result;
    } catch (error) {
      logger.error('HSA payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'HSA payment failed'
      };
    }
  }

  async capturePayment(paymentId: string): Promise<ProcessorResponse> {
    try {
      // In a real implementation, you would retrieve the payment intent ID
      // from your database and capture it with Stripe
      const paymentIntentId = `pi_${paymentId}`; // Mock implementation
      
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          data: {
            stripePaymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            charges: paymentIntent.charges.data
          }
        };
      } else {
        return {
          success: false,
          error: `Payment capture failed with status: ${paymentIntent.status}`
        };
      }
    } catch (error) {
      logger.error('Payment capture error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment capture failed'
      };
    }
  }

  async refundPayment(paymentId: string, amount: number, reason: string): Promise<ProcessorResponse> {
    try {
      // In a real implementation, you would retrieve the charge ID
      // from your database and create a refund
      const chargeId = `ch_${paymentId}`; // Mock implementation
      
      const refund = await this.stripe.refunds.create({
        charge: chargeId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          originalPaymentId: paymentId,
          refundReason: reason
        }
      });

      return {
        success: true,
        data: {
          stripeRefundId: refund.id,
          status: refund.status,
          amount: refund.amount
        }
      };
    } catch (error) {
      logger.error('Payment refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment refund failed'
      };
    }
  }

  async cancelPayment(paymentId: string): Promise<ProcessorResponse> {
    try {
      // In a real implementation, you would retrieve the payment intent ID
      // from your database and cancel it
      const paymentIntentId = `pi_${paymentId}`; // Mock implementation
      
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);

      return {
        success: true,
        data: {
          stripePaymentIntentId: paymentIntent.id,
          status: paymentIntent.status
        }
      };
    } catch (error) {
      logger.error('Payment cancellation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment cancellation failed'
      };
    }
  }

  async createPaymentMethod(paymentDetails: any): Promise<ProcessorResponse> {
    try {
      let paymentMethod;

      if (paymentDetails.type === 'card') {
        paymentMethod = await this.stripe.paymentMethods.create({
          type: 'card',
          card: {
            token: paymentDetails.token
          },
          billing_details: paymentDetails.billingDetails
        });
      } else if (paymentDetails.type === 'bank_account') {
        paymentMethod = await this.stripe.paymentMethods.create({
          type: 'us_bank_account',
          us_bank_account: {
            token: paymentDetails.token
          },
          billing_details: paymentDetails.billingDetails
        });
      }

      return {
        success: true,
        data: {
          paymentMethodId: paymentMethod?.id,
          type: paymentMethod?.type,
          last4: paymentMethod?.card?.last4 || paymentMethod?.us_bank_account?.last4
        }
      };
    } catch (error) {
      logger.error('Create payment method error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment method'
      };
    }
  }

  async validatePaymentMethod(paymentMethodId: string): Promise<ProcessorResponse> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

      return {
        success: true,
        data: {
          isValid: true,
          type: paymentMethod.type,
          last4: paymentMethod.card?.last4 || paymentMethod.us_bank_account?.last4,
          expiryMonth: paymentMethod.card?.exp_month,
          expiryYear: paymentMethod.card?.exp_year
        }
      };
    } catch (error) {
      logger.error('Validate payment method error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid payment method'
      };
    }
  }
}
