import { expect } from 'vitest';

/**
 * API Helper for Regression Tests
 * 
 * Provides methods to interact with the API for testing
 */

export class RegressionApiHelper {
  private baseUrl: string;
  private accessToken: string | null = null;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.API_URL || 'http://localhost:3004';
  }
  
  /**
   * Make authenticated request
   */
  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` }),
      ...options.headers,
    };
    
    const response = await fetch(`${this.baseUrl}/v1${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`API Error: ${response.status} - ${error.message}`);
    }
    
    return response.json();
  }
  
  /**
   * Register new user and login
   */
  async registerAndLogin() {
    const phone = `+99890${Date.now()}`;
    
    // Register
    await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: 'Regression Test User',
        phone,
        password: 'password123',
        preferred_language: 'ru',
      }),
    });
    
    // Login
    const loginResponse = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        login: phone,
        password: 'password123',
      }),
    });
    
    this.accessToken = loginResponse.data.access_token;
    return loginResponse;
  }
  
  /**
   * Create test order
   */
  async createTestOrder(overrides = {}) {
    const response = await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        details: [{
          service_id: 'test-service-id',
          equipment_id: 'test-equipment-id',
          issue_id: 'test-issue-id',
          price: 0,
        }],
        guest_name: 'Regression Test Customer',
        guest_phone: `+99890${Date.now()}`,
        ...overrides,
      }),
    });
    
    return response.data;
  }
  
  /**
   * Get order by ID
   */
  async getOrder(orderId: string) {
    return this.request(`/orders/${orderId}`);
  }
  
  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, reason = '') {
    return this.request(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }
  
  /**
   * Set order price
   */
  async setOrderPrice(orderId: string, details: { detail_id: string; price: number }[]) {
    return this.request(`/orders/${orderId}/set-price`, {
      method: 'POST',
      body: JSON.stringify({ details }),
    });
  }
  
  /**
   * Approve order price
   */
  async approvePrice(orderId: string) {
    return this.request(`/orders/${orderId}/approve-price`, {
      method: 'POST',
    });
  }
  
  /**
   * Create payment
   */
  async createPayment(orderId: string, amount: number, type = 'CASH') {
    return this.request(`/orders/${orderId}/payments`, {
      method: 'POST',
      body: JSON.stringify({
        payment_type: type,
        paid_amount: amount,
        currency: 'UZS',
      }),
    });
  }
  
  /**
   * Get equipments
   */
  async getEquipments() {
    return this.request('/equipments');
  }
  
  /**
   * Get services
   */
  async getServices() {
    return this.request('/services');
  }
  
  /**
   * Get issues
   */
  async getIssues() {
    return this.request('/issues');
  }
  
  /**
   * Get order stats
   */
  async getOrderStats(period = 'week') {
    return this.request(`/orders/stats?period=${period}`);
  }
  
  /**
   * Get financial report
   */
  async getFinancialReport(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/payments/financial-report?${params.toString()}`);
  }
  
  /**
   * Set access token manually
   */
  setToken(token: string) {
    this.accessToken = token;
  }
  
  /**
   * Clear token
   */
  clearToken() {
    this.accessToken = null;
  }
}

/**
 * Test data generators
 */
export const generateTestData = {
  user() {
    const timestamp = Date.now();
    return {
      full_name: `Test User ${timestamp}`,
      phone: `+99890${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'password123',
      preferred_language: 'ru' as const,
    };
  },
  
  order() {
    return {
      details: [{
        service_id: 'test-service-id',
        equipment_id: 'test-equipment-id',
        issue_id: 'test-issue-id',
        price: Math.floor(Math.random() * 100000) + 5000,
      }],
      guest_name: `Test Customer ${Date.now()}`,
      guest_phone: `+99890${Date.now()}`,
      guest_email: `guest${Date.now()}@example.com`,
    };
  },
  
  payment(amount?: number) {
    return {
      payment_type: 'CASH' as const,
      paid_amount: amount || Math.floor(Math.random() * 50000) + 10000,
      currency: 'UZS' as const,
    };
  },
};

/**
 * Custom assertions for regression testing
 */
export const regressionExpect = {
  isValidOrder(order: any) {
    expect(order).toHaveProperty('id');
    expect(order).toHaveProperty('status');
    expect(order).toHaveProperty('client_id');
    expect(order).toHaveProperty('total_price_uzs');
    expect(order).toHaveProperty('created_at');
    expect(order.details).toBeInstanceOf(Array);
  },
  
  isValidUser(user: any) {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('full_name');
    expect(user).toHaveProperty('phone');
    expect(user).toHaveProperty('role');
  },
  
  isValidPayment(payment: any) {
    expect(payment).toHaveProperty('id');
    expect(payment).toHaveProperty('order_id');
    expect(payment).toHaveProperty('payment_type');
    expect(payment).toHaveProperty('paid_amount');
    expect(payment).toHaveProperty('paid_at');
  },
  
  isSuccessResponse(response: any) {
    expect(response).toHaveProperty('success', true);
  },
  
  hasPagination(response: any) {
    expect(response).toHaveProperty('meta');
    expect(response.meta).toHaveProperty('total');
    expect(response.meta).toHaveProperty('page');
    expect(response.meta).toHaveProperty('limit');
  },
};
