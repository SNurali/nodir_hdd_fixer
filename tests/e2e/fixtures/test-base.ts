import { test as base, expect } from '@playwright/test';

/**
 * Base test fixture with common setup
 */

// API Helper for backend operations
export class ApiHelper {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async createTestUser() {
    const phone = `+99890${Date.now()}`;
    const response = await fetch(`${this.baseUrl}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test User',
        phone,
        password: 'password123',
        preferred_language: 'ru',
      }),
    });
    return response.json();
  }
  
  async login(phone: string, password: string) {
    const response = await fetch(`${this.baseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: phone, password }),
    });
    return response.json();
  }
  
  async createOrder(tokens: { access_token: string }, orderData: any) {
    const response = await fetch(`${this.baseUrl}/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify(orderData),
    });
    return response.json();
  }
}

// Test data
export const testData = {
  defaultUser: {
    full_name: 'Test User',
    phone: '+998901234567',
    password: 'password123',
  },
  defaultOrder: {
    details: [{
      service_id: 'test-service-id',
      equipment_id: 'test-equipment-id',
      issue_id: 'test-issue-id',
      price: 10000,
    }],
  },
};

// Extend Playwright test with our fixtures
export const test = base.extend<{
  apiHelper: ApiHelper;
  authenticatedPage: any;
}>({
  apiHelper: async ({}, use) => {
    const apiBaseUrl = process.env.API_URL || 'http://localhost:3004';
    const helper = new ApiHelper(apiBaseUrl);
    await use(helper);
  },
  
  authenticatedPage: async ({ page, apiHelper }, use) => {
    // Login before each test
    const phone = `+99890${Date.now()}`;
    
    // Register via API
    await fetch(`${process.env.API_URL || 'http://localhost:3004'}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test User',
        phone,
        password: 'password123',
        preferred_language: 'ru',
      }),
    });
    
    // Login via UI
    await page.goto('/login');
    await page.fill('input[name="login"]', phone);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(client|admin|master)/);
    
    await use(page);
  },
});

export { expect };
