import { describe, it, expect, beforeAll } from 'vitest';
import { RegressionApiHelper, generateTestData, regressionExpect } from '../utils/api-helper';

/**
 * Regression Tests: Payments & Financial Reports API
 */

describe('Payments API Regression', () => {
  let api: RegressionApiHelper;
  let testOrderId: string;
  
  beforeAll(async () => {
    api = new RegressionApiHelper();
    await api.registerAndLogin();
    
    // Create test order
    const order = await api.createTestOrder();
    testOrderId = order.id;
    
    // Set and approve price
    await api.setOrderPrice(order.id, [
      { detail_id: order.details[0].id, price: 50000 },
    ]);
    await api.approvePrice(order.id);
  });
  
  afterAll(() => {
    api.clearToken();
  });
  
  describe('POST /orders/:orderId/payments', () => {
    it('should create payment successfully', async () => {
      const paymentData = generateTestData.payment(50000);
      
      const response = await api.createPayment(testOrderId, paymentData.paid_amount, paymentData.payment_type);
      
      regressionExpect.isValidPayment(response);
      expect(response.paid_amount).toBe(50000);
    });
    
    it('should create payment with different currency', async () => {
      const response = await api.request(`/orders/${testOrderId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          payment_type: 'UZCARD',
          paid_amount: 40, // USD
          currency: 'USD',
        }),
      });
      
      regressionExpect.isValidPayment(response);
      expect(response.currency).toBe('USD');
    });
    
    it('should create split payments', async () => {
      const response = await api.request(`/orders/${testOrderId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          split_payments: [
            {
              payment_type: 'CASH',
              paid_amount: 25000,
              currency: 'UZS',
            },
            {
              payment_type: 'UZCARD',
              paid_amount: 25000,
              currency: 'UZS',
            },
          ],
        }),
      });
      
      expect(response).toBeInstanceOf(Array);
      expect(response).toHaveLength(2);
    });
    
    it('should update order total_paid after payment', async () => {
      // Create new order for this test
      const order = await api.createTestOrder();
      await api.setOrderPrice(order.id, [
        { detail_id: order.details[0].id, price: 30000 },
      ]);
      await api.approvePrice(order.id);
      
      // Create payment
      await api.createPayment(order.id, 30000);
      
      // Check order was updated
      const orderResponse = await api.getOrder(order.id);
      expect(Number(orderResponse.total_paid_uzs)).toBeGreaterThanOrEqual(30000);
    });
  });
  
  describe('PATCH /payments/:id', () => {
    it('should update payment amount', async () => {
      // Create payment first
      const order = await api.createTestOrder();
      await api.setOrderPrice(order.id, [
        { detail_id: order.details[0].id, price: 20000 },
      ]);
      await api.approvePrice(order.id);
      
      const paymentResponse = await api.createPayment(order.id, 20000);
      const paymentId = Array.isArray(paymentResponse) ? paymentResponse[0].id : paymentResponse.id;
      
      // Update payment
      const response = await api.request(`/payments/${paymentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          paid_amount: 25000,
          currency: 'UZS',
        }),
      });
      
      expect(response.paid_amount).toBe(25000);
    });
  });
  
  describe('POST /payments/refund/:id', () => {
    it('should refund payment', async () => {
      // Create order and payment
      const order = await api.createTestOrder();
      await api.setOrderPrice(order.id, [
        { detail_id: order.details[0].id, price: 15000 },
      ]);
      await api.approvePrice(order.id);
      
      const paymentResponse = await api.createPayment(order.id, 15000);
      const paymentId = Array.isArray(paymentResponse) ? paymentResponse[0].id : paymentResponse.id;
      
      // Refund payment
      const response = await api.request(`/payments/refund/${paymentId}`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Customer request' }),
      });
      
      regressionExpect.isSuccessResponse(response);
    });
    
    it('should update order total_paid after refund', async () => {
      const order = await api.createTestOrder();
      await api.setOrderPrice(order.id, [
        { detail_id: order.details[0].id, price: 10000 },
      ]);
      await api.approvePrice(order.id);
      
      const paymentResponse = await api.createPayment(order.id, 10000);
      const paymentId = Array.isArray(paymentResponse) ? paymentResponse[0].id : paymentResponse.id;
      
      // Get initial paid amount
      const initialOrder = await api.getOrder(order.id);
      const initialPaid = Number(initialOrder.total_paid_uzs);
      
      // Refund
      await api.request(`/payments/refund/${paymentId}`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Test refund' }),
      });
      
      // Check paid amount decreased
      const updatedOrder = await api.getOrder(order.id);
      expect(Number(updatedOrder.total_paid_uzs)).toBeLessThan(initialPaid);
    });
  });
  
  describe('GET /payments/financial-report', () => {
    it('should return financial report', async () => {
      const response = await api.getFinancialReport();
      
      expect(response).toHaveProperty('total_revenue');
      expect(response).toHaveProperty('total_paid');
      expect(response).toHaveProperty('total_unpaid');
      expect(response).toHaveProperty('total_overdue');
      expect(response).toHaveProperty('by_currency');
      expect(response).toHaveProperty('by_payment_type');
      expect(response).toHaveProperty('daily_revenue');
      expect(response).toHaveProperty('unpaid_orders');
    });
    
    it('should support date range filtering', async () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await api.getFinancialReport(startDate, endDate);
      
      expect(response).toHaveProperty('total_revenue');
    });
  });
  
  describe('GET /payments/daily-revenue', () => {
    it('should return daily revenue', async () => {
      const response = await api.request('/payments/daily-revenue?days=30');
      
      expect(response.data).toBeInstanceOf(Array);
      
      if (response.data.length > 0) {
        const day = response.data[0];
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('amount');
        expect(day).toHaveProperty('count');
      }
    });
    
    it('should support custom days parameter', async () => {
      const days = [7, 14, 30, 90];
      
      for (const day of days) {
        const response = await api.request(`/payments/daily-revenue?days=${day}`);
        expect(response.data).toBeInstanceOf(Array);
      }
    });
  });
});
