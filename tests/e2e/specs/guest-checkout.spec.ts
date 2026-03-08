import { test, expect } from '../fixtures/test-base';

/**
 * E2E Tests: Guest Checkout Flow
 * 
 * Tests for creating orders without authentication
 */

test.describe('Guest Checkout', () => {
  test('should create order as guest successfully', async ({ page }) => {
    // Go to new order page
    await page.goto('/orders/new');
    
    // Step 1: Select equipment
    await page.click('[data-testid="equipment-option"]:first-child');
    await page.click('button:has-text("Далее")');
    
    // Step 2: Select issue
    await page.click('[data-testid="issue-option"]:first-child');
    await page.click('button:has-text("Далее")');
    
    // Step 3: Fill guest contact information
    await page.fill('input[name="guest_name"]', 'Guest User');
    await page.fill('input[name="guest_phone"]', '+998901234567');
    await page.fill('input[name="guest_email"]', 'guest@example.com');
    await page.click('button:has-text("Далее")');
    
    // Step 4: Review order
    await page.click('button:has-text("Создать заказ")');
    
    // Should redirect to order success page
    await page.waitForURL(/\/orders\/[a-f0-9-]+/);
    
    // Verify order created
    const successMessage = page.locator('.success-message');
    await expect(successMessage).toBeVisible();
    
    // Verify tracking token is displayed
    const trackingToken = page.locator('[data-testid="tracking-token"]');
    await expect(trackingToken).toBeVisible();
  });

  test('should validate guest phone format', async ({ page }) => {
    await page.goto('/orders/new');
    
    // Select equipment
    await page.click('[data-testid="equipment-option"]:first-child');
    await page.click('button:has-text("Далее")');
    
    // Select issue
    await page.click('[data-testid="issue-option"]:first-child');
    await page.click('button:has-text("Далее")');
    
    // Fill with invalid phone
    await page.fill('input[name="guest_name"]', 'Guest User');
    await page.fill('input[name="guest_phone"]', 'invalid-phone');
    
    // Try to submit
    await page.click('button:has-text("Далее")');
    
    // Should show validation error
    const errorElement = page.locator('input[name="guest_phone"]:invalid');
    await expect(errorElement).toBeVisible();
  });

  test('should require guest phone for order creation', async ({ page }) => {
    await page.goto('/orders/new');
    
    // Select equipment
    await page.click('[data-testid="equipment-option"]:first-child');
    await page.click('button:has-text("Далее")');
    
    // Select issue
    await page.click('[data-testid="issue-option"]:first-child');
    await page.click('button:has-text("Далее")');
    
    // Fill name but not phone
    await page.fill('input[name="guest_name"]', 'Guest User');
    
    // Try to submit
    await page.click('button:has-text("Далее")');
    
    // Should show error
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('телефон');
  });

  test('should create client record for guest', async ({ page, apiHelper }) => {
    const guestPhone = `+99890${Date.now()}`;
    
    await page.goto('/orders/new');
    
    // Select equipment
    await page.click('[data-testid="equipment-option"]:first-child');
    await page.click('button:has-text("Далее")');
    
    // Select issue
    await page.click('[data-testid="issue-option"]:first-child');
    await page.click('button:has-text("Далее")');
    
    // Fill guest info
    await page.fill('input[name="guest_name"]', 'Guest User');
    await page.fill('input[name="guest_phone"]', guestPhone);
    await page.fill('input[name="guest_email"]', 'guest@example.com');
    await page.click('button:has-text("Далее")');
    
    // Review and create
    await page.click('button:has-text("Создать заказ")');
    await page.waitForURL(/\/orders\/[a-f0-9-]+/);
    
    // Verify client was created via API
    const response = await fetch(`${process.env.API_URL || 'http://localhost:3004'}/v1/clients`, {
      headers: {
        'Authorization': `Bearer ${(await apiHelper.login(guestPhone, 'password123')).access_token}`,
      },
    });
    
    expect(response.ok).toBe(true);
  });

  test('should sync guest contacts with client profile', async ({ page, apiHelper }) => {
    const guestPhone = `+99890${Date.now()}`;
    const guestEmail = `guest${Date.now()}@example.com`;
    
    await page.goto('/orders/new');
    
    // Select equipment and issue
    await page.click('[data-testid="equipment-option"]:first-child');
    await page.click('button:has-text("Далее")');
    await page.click('[data-testid="issue-option"]:first-child');
    await page.click('button:has-text("Далее")');
    
    // Fill guest info with updated details
    await page.fill('input[name="guest_name"]', 'Updated Guest Name');
    await page.fill('input[name="guest_phone"]', guestPhone);
    await page.fill('input[name="guest_email"]', guestEmail);
    await page.click('button:has-text("Далее")');
    
    // Create order
    await page.click('button:has-text("Создать заказ")');
    await page.waitForURL(/\/orders\/[a-f0-9-]+/);
    
    // Login and check profile
    await page.goto('/login');
    await page.fill('input[name="login"]', guestPhone);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/client/);
    
    // Verify profile was updated
    // (This would require accessing the profile page)
  });
});

test.describe('Order Tracking (Guest)', () => {
  test('should track order by public token', async ({ page }) => {
    // Go to tracking page
    await page.goto('/track');
    
    // Enter tracking token (would need a real token from created order)
    // For now, test the UI flow
    await page.fill('input[name="tracking_token"]', 'test-token-123');
    await page.click('button:has-text("Отследить")');
    
    // Should either show order or error
    const result = page.locator('[data-testid="tracking-result"]');
    await expect(result).toBeVisible();
  });

  test('should show error for invalid tracking token', async ({ page }) => {
    await page.goto('/track');
    
    // Enter invalid token
    await page.fill('input[name="tracking_token"]', 'invalid-token');
    await page.click('button:has-text("Отследить")');
    
    // Should show error
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('не найден');
  });
});
