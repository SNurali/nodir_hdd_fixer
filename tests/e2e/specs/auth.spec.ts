import { test, expect } from '../fixtures/test-base';

/**
 * E2E Tests: Authentication Flow
 * 
 * Tests for user registration, login, logout
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Go to login page before each test
    await page.goto('/login');
  });

  test.describe('Registration', () => {
    test('should register a new user successfully', async ({ page, apiHelper }) => {
      const phone = `+99890${Date.now()}`;
      
      // Go to registration page
      await page.goto('/register');
      
      // Fill registration form
      await page.fill('input[name="full_name"]', 'Test User');
      await page.fill('input[name="phone"]', phone);
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirm_password"]', 'password123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect to client dashboard
      await page.waitForURL(/\/client/);
      
      // Verify user is logged in
      const userMenu = page.locator('[data-testid="user-menu"]');
      await expect(userMenu).toBeVisible();
    });

    test('should show error for existing phone', async ({ page }) => {
      const phone = '+998901234567'; // Existing test user
      
      await page.goto('/register');
      
      // Fill form with existing phone
      await page.fill('input[name="full_name"]', 'Test User');
      await page.fill('input[name="phone"]', phone);
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirm_password"]', 'password123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show error message
      const errorMessage = page.locator('.error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('уже существует');
    });

    test('should validate phone format', async ({ page }) => {
      await page.goto('/register');
      
      // Fill with invalid phone
      await page.fill('input[name="full_name"]', 'Test User');
      await page.fill('input[name="phone"]', 'invalid-phone');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirm_password"]', 'password123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show validation error
      const errorElement = page.locator('input[name="phone"]:invalid');
      await expect(errorElement).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test('should login with phone successfully', async ({ page, apiHelper }) => {
      const phone = `+99890${Date.now()}`;
      
      // Create user via API
      await apiHelper.createTestUser();
      
      // Login with phone
      await page.fill('input[name="login"]', phone);
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL(/\/(client|admin|master)/);
      
      // Verify user is logged in
      const userMenu = page.locator('[data-testid="user-menu"]');
      await expect(userMenu).toBeVisible();
    });

    test('should login with email successfully', async ({ page }) => {
      const email = `test${Date.now()}@example.com`;
      const phone = `+99890${Date.now()}`;
      
      // Create user with email via API
      await fetch(`${process.env.API_URL || 'http://localhost:3004'}/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Test User',
          phone,
          email,
          password: 'password123',
          preferred_language: 'ru',
        }),
      });
      
      // Login with email
      await page.fill('input[name="login"]', email);
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL(/\/(client|admin|master)/);
      
      // Verify user is logged in
      const userMenu = page.locator('[data-testid="user-menu"]');
      await expect(userMenu).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      // Try to login with invalid credentials
      await page.fill('input[name="login"]', '+998901234567');
      await page.fill('input[name="password"]', 'wrong-password');
      await page.click('button[type="submit"]');
      
      // Should show error message
      const errorMessage = page.locator('.error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Неверный');
    });

    test('should show error for non-existent user', async ({ page }) => {
      // Try to login with non-existent user
      await page.fill('input[name="login"]', '+998999999999');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should show error message
      const errorMessage = page.locator('.error-message');
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      
      // Open user menu
      await page.click('[data-testid="user-menu"]');
      
      // Click logout
      await page.click('[data-testid="logout-button"]');
      
      // Wait for redirect to login page
      await page.waitForURL('/login');
      
      // Verify user is logged out
      const loginForm = page.locator('form[name="login-form"]');
      await expect(loginForm).toBeVisible();
    });
  });

  test.describe('Password Recovery', () => {
    test('should request password reset', async ({ page }) => {
      await page.goto('/forgot-password');
      
      // Fill phone
      await page.fill('input[name="login"]', '+998901234567');
      await page.click('button[type="submit"]');
      
      // Should show success message
      const successMessage = page.locator('.success-message');
      await expect(successMessage).toBeVisible();
      await expect(successMessage).toContainText('инструкции отправлены');
    });

    test('should reset password with token', async ({ page }) => {
      // This would require a valid reset token from email/SMS
      // For now, we test the UI flow
      await page.goto('/reset-password?token=test-token');
      
      // Fill new password
      await page.fill('input[name="new_password"]', 'newpassword123');
      await page.fill('input[name="confirm_password"]', 'newpassword123');
      await page.click('button[type="submit"]');
      
      // Should redirect to login
      await page.waitForURL('/login');
    });
  });
});
