import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RegressionApiHelper, generateTestData, regressionExpect } from '../utils/api-helper';

/**
 * Regression Tests: Orders API
 * 
 * Tests to ensure order-related API endpoints continue to work correctly
 */

describe('Orders API Regression', () => {
  let api: RegressionApiHelper;
  let testOrderId: string;
  
  beforeAll(async () => {
    api = new RegressionApiHelper();
    await api.registerAndLogin();
  });
  
  afterAll(() => {
    api.clearToken();
  });
  
  describe('POST /orders', () => {
    it('should create order with valid data', async () => {
      const orderData = generateTestData.order();
      const response = await api.createTestOrder(orderData);
      
      regressionExpect.isValidOrder(response);
      expect(response.status).toBe('new');
      
      testOrderId = response.id;
    });
    
    it('should create order with guest checkout', async () => {
      const response = await api.createTestOrder({
        guest_name: 'Guest User',
        guest_phone: '+998909876543',
        guest_email: 'guest@test.com',
      });
      
      regressionExpect.isValidOrder(response);
      expect(response.client_id).toBeDefined();
    });
    
    it('should create order with multiple details', async () => {
      const response = await api.createTestOrder({
        details: [
          {
            service_id: 'service-1',
            equipment_id: 'equip-1',
            issue_id: 'issue-1',
            price: 10000,
          },
          {
            service_id: 'service-2',
            equipment_id: 'equip-2',
            issue_id: 'issue-2',
            price: 15000,
          },
        ],
        guest_name: 'Multi Item Customer',
        guest_phone: '+998901111111',
      });
      
      regressionExpect.isValidOrder(response);
      expect(response.details).toHaveLength(2);
      expect(response.total_price_uzs).toBe(25000);
    });
  });
  
  describe('GET /orders/:id', () => {
    it('should get order by ID', async () => {
      const order = await api.createTestOrder();
      const response = await api.getOrder(order.id);
      
      regressionExpect.isValidOrder(response);
      expect(response.id).toBe(order.id);
    });
    
    it('should include order details', async () => {
      const order = await api.createTestOrder();
      const response = await api.getOrder(order.id);
      
      expect(response.details).toBeInstanceOf(Array);
      expect(response.details.length).toBeGreaterThan(0);
    });
    
    it('should include client information', async () => {
      const order = await api.createTestOrder();
      const response = await api.getOrder(order.id);
      
      expect(response.client).toBeDefined();
      expect(response.client.full_name).toBeDefined();
    });
  });
  
  describe('PATCH /orders/:id', () => {
    it('should update order status', async () => {
      const order = await api.createTestOrder();
      const response = await api.updateOrderStatus(order.id, 'assigned');
      
      expect(response.status).toBe('assigned');
    });
    
    it('should update order deadline', async () => {
      const order = await api.createTestOrder();
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await api.updateOrderStatus(order.id, 'assigned', 'Updated deadline');
      
      expect(response).toBeDefined();
    });
  });
  
  describe('POST /orders/:id/set-price', () => {
    it('should set price for order details', async () => {
      const order = await api.createTestOrder();
      const detailId = order.details[0].id;
      
      const response = await api.setOrderPrice(order.id, [
        { detail_id: detailId, price: 20000 },
      ]);
      
      expect(response.total_price_uzs).toBe(20000);
      expect(response.status).toBe('awaiting_approval');
    });
    
    it('should update multiple detail prices', async () => {
      const order = await api.createTestOrder({
        details: [
          { service_id: 's1', equipment_id: 'e1', issue_id: 'i1', price: 0 },
          { service_id: 's2', equipment_id: 'e2', issue_id: 'i2', price: 0 },
        ],
      });
      
      const response = await api.setOrderPrice(order.id, [
        { detail_id: order.details[0].id, price: 15000 },
        { detail_id: order.details[1].id, price: 25000 },
      ]);
      
      expect(response.total_price_uzs).toBe(40000);
    });
  });
  
  describe('POST /orders/:id/approve-price', () => {
    it('should approve order price', async () => {
      const order = await api.createTestOrder();
      
      // Set price first
      await api.setOrderPrice(order.id, [
        { detail_id: order.details[0].id, price: 30000 },
      ]);
      
      // Approve price
      const response = await api.approvePrice(order.id);
      
      expect(response.status).toBe('approved');
      expect(response.price_approved_at).toBeDefined();
    });
  });
  
  describe('Order Status Transitions', () => {
    it('should follow valid status flow: new → assigned → diagnosing → awaiting_approval → approved', async () => {
      const order = await api.createTestOrder();
      
      // new → assigned
      let response = await api.updateOrderStatus(order.id, 'assigned');
      expect(response.status).toBe('assigned');
      
      // assigned → diagnosing
      response = await api.updateOrderStatus(order.id, 'diagnosing');
      expect(response.status).toBe('diagnosing');
      
      // diagnosing → awaiting_approval (after setting price)
      await api.setOrderPrice(order.id, [
        { detail_id: order.details[0].id, price: 35000 },
      ]);
      // Status should automatically change to awaiting_approval
      
      // awaiting_approval → approved
      response = await api.approvePrice(order.id);
      expect(response.status).toBe('approved');
    });
  });
  
  describe('GET /orders/stats', () => {
    it('should return order statistics', async () => {
      const response = await api.getOrderStats('week');
      
      expect(response).toHaveProperty('totalOrders');
      expect(response).toHaveProperty('activeRepairs');
      expect(response).toHaveProperty('completedToday');
      expect(response).toHaveProperty('totalRevenue');
      expect(response).toHaveProperty('period');
    });
    
    it('should support different periods', async () => {
      const periods = ['today', 'week', 'month'];
      
      for (const period of periods) {
        const response = await api.getOrderStats(period);
        expect(response.period).toBe(period);
      }
    });
  });
});
