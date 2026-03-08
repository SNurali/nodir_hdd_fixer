import { describe, it, expect, beforeAll } from 'vitest';
import { RegressionApiHelper, generateTestData, regressionExpect } from '../utils/api-helper';

/**
 * Regression Tests: Auth API
 * 
 * Tests to ensure authentication endpoints continue to work correctly
 */

describe('Auth API Regression', () => {
  let api: RegressionApiHelper;
  
  beforeAll(() => {
    api = new RegressionApiHelper();
  });
  
  describe('POST /auth/register', () => {
    it('should register new user successfully', async () => {
      const userData = generateTestData.user();
      
      const response = await api.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      regressionExpect.isSuccessResponse(response);
      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('refresh_token');
      expect(response.data.user).toHaveProperty('role', 'client');
    });
    
    it('should register user with all fields', async () => {
      const userData = {
        full_name: 'Full Name User',
        phone: `+99890${Date.now()}`,
        email: `full${Date.now()}@example.com`,
        telegram: '@telegram_user',
        password: 'password123',
        preferred_language: 'ru' as const,
      };
      
      const response = await api.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      regressionExpect.isSuccessResponse(response);
      expect(response.data.user.email).toBe(userData.email);
    });
    
    it('should fail for existing phone', async () => {
      const userData = {
        full_name: 'Existing User',
        phone: '+998901234567', // Known test user
        password: 'password123',
        preferred_language: 'ru' as const,
      };
      
      await expect(
        api.request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData),
        })
      ).rejects.toThrow();
    });
    
    it('should fail for invalid phone format', async () => {
      const userData = {
        full_name: 'Invalid Phone User',
        phone: 'invalid-phone',
        password: 'password123',
        preferred_language: 'ru' as const,
      };
      
      await expect(
        api.request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData),
        })
      ).rejects.toThrow();
    });
    
    it('should fail for weak password', async () => {
      const userData = {
        full_name: 'Weak Password User',
        phone: `+99890${Date.now()}`,
        password: '123', // Too short
        preferred_language: 'ru' as const,
      };
      
      await expect(
        api.request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData),
        })
      ).rejects.toThrow();
    });
  });
  
  describe('POST /auth/login', () => {
    let testUserPhone: string;
    
    beforeAll(async () => {
      // Create test user
      testUserPhone = `+99890${Date.now()}`;
      await api.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: 'Login Test User',
          phone: testUserPhone,
          password: 'password123',
          preferred_language: 'ru',
        }),
      });
    });
    
    it('should login with phone successfully', async () => {
      const response = await api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          login: testUserPhone,
          password: 'password123',
        }),
      });
      
      regressionExpect.isSuccessResponse(response);
      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('refresh_token');
      regressionExpect.isValidUser(response.data.user);
    });
    
    it('should fail for invalid credentials', async () => {
      await expect(
        api.request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            login: testUserPhone,
            password: 'wrong-password',
          }),
        })
      ).rejects.toThrow();
    });
    
    it('should fail for non-existent user', async () => {
      await expect(
        api.request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            login: '+998999999999',
            password: 'password123',
          }),
        })
      ).rejects.toThrow();
    });
  });
  
  describe('POST /auth/forgot-password', () => {
    it('should accept forgot password request', async () => {
      const response = await api.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          login: '+998901234567',
        }),
      });
      
      regressionExpect.isSuccessResponse(response);
      expect(response.message).toBeDefined();
    });
    
    it('should return generic response for non-existent user', async () => {
      const response = await api.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          login: '+998999999999',
        }),
      });
      
      // Should return success even for non-existent user (security best practice)
      regressionExpect.isSuccessResponse(response);
    });
  });
  
  describe('POST /auth/reset-password', () => {
    it('should fail for invalid token', async () => {
      await expect(
        api.request('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            token: 'invalid-token',
            new_password: 'newpassword123',
          }),
        })
      ).rejects.toThrow();
    });
    
    it('should fail for weak new password', async () => {
      // This would require a valid token, testing validation logic
      await expect(
        api.request('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            token: 'valid-token-format-but-fake',
            new_password: '123', // Too short
          }),
        })
      ).rejects.toThrow();
    });
  });
});
