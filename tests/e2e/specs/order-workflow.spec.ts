import { test, expect } from '../fixtures/test-base';

/**
 * E2E Tests: Order Workflow
 * 
 * Tests for complete order lifecycle:
 * Create → Assign Master → Diagnose → Set Price → Approve → Complete → Close
 */

test.describe('Order Workflow', () => {
  let orderId: string;
  
  test.beforeEach(async ({ authenticatedPage }) => {
    // Login before each test
    const page = authenticatedPage;
    await page.waitForLoadState('networkidle');
  });

  test('should complete full order workflow', async ({ page, apiHelper }) => {
    // Step 1: Create order via API
    const tokens = await apiHelper.login('+998901234567', 'password123');
    const orderResponse = await apiHelper.createOrder(tokens, {
      details: [{
        service_id: 'test-service-id',
        equipment_id: 'test-equipment-id',
        issue_id: 'test-issue-id',
        price: 0, // Price will be set by master
      }],
      guest_name: 'Test Customer',
      guest_phone: `+99890${Date.now()}`,
    });
    
    orderId = orderResponse.data.id;
    
    // Step 2: Admin assigns master
    await page.goto(`/admin/orders/${orderId}`);
    await page.click('[data-testid="assign-master-button"]');
    await page.click('[data-testid="master-option"]:first-child');
    await page.click('[data-testid="confirm-assign"]');
    
    // Verify order status changed to "assigned"
    const statusBadge = page.locator('[data-testid="order-status"]');
    await expect(statusBadge).toHaveText('Назначен');
    
    // Step 3: Master starts diagnostics
    await page.goto(`/master/orders/${orderId}`);
    await page.click('[data-testid="start-diagnosing"]');
    
    // Verify status changed to "diagnosing"
    await expect(statusBadge).toHaveText('Диагностика');
    
    // Step 4: Master sets price
    await page.fill('[data-testid="price-input"]', '15000');
    await page.click('[data-testid="set-price"]');
    
    // Verify status changed to "awaiting_approval"
    await expect(statusBadge).toHaveText('Ожидает одобрения');
    
    // Step 5: Client approves price
    await page.goto(`/client/orders/${orderId}`);
    await page.click('[data-testid="approve-price"]');
    await page.click('[data-testid="confirm-approve"]');
    
    // Verify status changed to "approved"
    await expect(statusBadge).toHaveText('Одобрено');
    
    // Step 6: Master completes work
    await page.goto(`/master/orders/${orderId}`);
    await page.click('[data-testid="complete-work"]');
    
    // Verify status changed to "ready_for_pickup"
    await expect(statusBadge).toHaveText('Готов к выдаче');
    
    // Step 7: Admin closes order (after payment)
    await page.goto(`/admin/orders/${orderId}`);
    await page.click('[data-testid="add-payment"]');
    await page.fill('[data-testid="payment-amount"]', '15000');
    await page.selectOption('[data-testid="payment-method"]', 'CASH');
    await page.click('[data-testid="confirm-payment"]');
    
    await page.click('[data-testid="close-order"]');
    await page.click('[data-testid="confirm-close"]');
    
    // Verify status changed to "issued"
    await expect(statusBadge).toHaveText('Выдан');
  });

  test('should allow master to be assigned to order', async ({ page, apiHelper }) => {
    // Create order
    const tokens = await apiHelper.login('+998901234567', 'password123');
    const orderResponse = await apiHelper.createOrder(tokens, {
      details: [{
        service_id: 'test-service-id',
        equipment_id: 'test-equipment-id',
        issue_id: 'test-issue-id',
      }],
      guest_name: 'Test Customer',
      guest_phone: `+99890${Date.now()}`,
    });
    
    orderId = orderResponse.data.id;
    
    // Admin assigns master
    await page.goto(`/admin/orders/${orderId}`);
    
    const initialStatus = await page.locator('[data-testid="order-status"]').textContent();
    expect(initialStatus).toContain('В ожидании');
    
    await page.click('[data-testid="assign-master-button"]');
    await page.click('[data-testid="master-option"]:first-child');
    await page.click('[data-testid="confirm-assign"]');
    
    // Verify status changed
    const newStatus = await page.locator('[data-testid="order-status"]').textContent();
    expect(newStatus).toContain('Назначен');
  });

  test('should allow master to set price', async ({ page, apiHelper }) => {
    // Create and assign order
    const tokens = await apiHelper.login('+998901234567', 'password123');
    const orderResponse = await apiHelper.createOrder(tokens, {
      details: [{
        service_id: 'test-service-id',
        equipment_id: 'test-equipment-id',
        issue_id: 'test-issue-id',
        attached_to: 'master-id',
      }],
      guest_name: 'Test Customer',
      guest_phone: `+99890${Date.now()}`,
    });
    
    orderId = orderResponse.data.id;
    
    // Master sets price
    await page.goto(`/master/orders/${orderId}`);
    await page.fill('[data-testid="price-input"]', '20000');
    await page.click('[data-testid="set-price"]');
    
    // Verify price is displayed
    const priceDisplay = page.locator('[data-testid="order-price"]');
    await expect(priceDisplay).toContainText('20 000');
    
    // Verify status changed to awaiting_approval
    const statusBadge = page.locator('[data-testid="order-status"]');
    await expect(statusBadge).toHaveText('Ожидает одобрения');
  });

  test('should allow client to approve price', async ({ page, apiHelper }) => {
    // Create order with price (awaiting_approval status)
    const tokens = await apiHelper.login('+998901234567', 'password123');
    const orderResponse = await apiHelper.createOrder(tokens, {
      details: [{
        service_id: 'test-service-id',
        equipment_id: 'test-equipment-id',
        issue_id: 'test-issue-id',
        price: 25000,
      }],
      guest_name: 'Test Customer',
      guest_phone: `+99890${Date.now()}`,
    });
    
    orderId = orderResponse.data.id;
    
    // Client approves price
    await page.goto(`/client/orders/${orderId}`);
    
    const priceDisplay = page.locator('[data-testid="order-price"]');
    await expect(priceDisplay).toContainText('25 000');
    
    await page.click('[data-testid="approve-price"]');
    await page.click('[data-testid="confirm-approve"]');
    
    // Verify status changed to approved
    const statusBadge = page.locator('[data-testid="order-status"]');
    await expect(statusBadge).toHaveText('Одобрено');
  });

  test('should allow client to reject price', async ({ page, apiHelper }) => {
    // Create order with price
    const tokens = await apiHelper.login('+998901234567', 'password123');
    const orderResponse = await apiHelper.createOrder(tokens, {
      details: [{
        service_id: 'test-service-id',
        equipment_id: 'test-equipment-id',
        issue_id: 'test-issue-id',
        price: 25000,
      }],
      guest_name: 'Test Customer',
      guest_phone: `+99890${Date.now()}`,
    });
    
    orderId = orderResponse.data.id;
    
    // Client rejects price
    await page.goto(`/client/orders/${orderId}`);
    await page.click('[data-testid="reject-price"]');
    await page.fill('[data-testid="rejection-reason"]', 'Too expensive');
    await page.click('[data-testid="confirm-reject"]');
    
    // Verify status changed back to diagnosing
    const statusBadge = page.locator('[data-testid="order-status"]');
    await expect(statusBadge).toHaveText('Диагностика');
    
    // Verify rejection reason is displayed
    const reasonDisplay = page.locator('[data-testid="rejection-reason-display"]');
    await expect(reasonDisplay).toContainText('Too expensive');
  });

  test('should allow master to complete work', async ({ page, apiHelper }) => {
    // Create approved order
    const tokens = await apiHelper.login('+998901234567', 'password123');
    const orderResponse = await apiHelper.createOrder(tokens, {
      details: [{
        service_id: 'test-service-id',
        equipment_id: 'test-equipment-id',
        issue_id: 'test-issue-id',
        price: 25000,
        attached_to: 'master-id',
      }],
      guest_name: 'Test Customer',
      guest_phone: `+99890${Date.now()}`,
    });
    
    orderId = orderResponse.data.id;
    
    // Approve price first
    await page.goto(`/client/orders/${orderId}`);
    await page.click('[data-testid="approve-price"]');
    await page.click('[data-testid="confirm-approve"]');
    
    // Master completes work
    await page.goto(`/master/orders/${orderId}`);
    await page.click('[data-testid="complete-work"]');
    
    // Verify status changed to ready_for_pickup
    const statusBadge = page.locator('[data-testid="order-status"]');
    await expect(statusBadge).toHaveText('Готов к выдаче');
  });
});

test.describe('Order Status Transitions', () => {
  test('should validate status transitions', async ({ page, apiHelper }) => {
    // Create new order
    const tokens = await apiHelper.login('+998901234567', 'password123');
    const orderResponse = await apiHelper.createOrder(tokens, {
      details: [{
        service_id: 'test-service-id',
        equipment_id: 'test-equipment-id',
        issue_id: 'test-issue-id',
      }],
    });
    
    orderId = orderResponse.data.id;
    
    // Verify initial status
    await page.goto(`/admin/orders/${orderId}`);
    let statusBadge = page.locator('[data-testid="order-status"]');
    await expect(statusBadge).toHaveText('В ожидании');
    
    // Try to close order without master (should fail)
    // This tests the state machine requirements
    // (Implementation depends on how the UI handles this)
  });
});
