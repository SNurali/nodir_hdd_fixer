/**
 * API Client - Type-safe HDD Fixer API
 * 
 * @example
 * ```typescript
 * import { apiClient } from '@/lib/api-client';
 * 
 * // Get orders
 * const orders = await apiClient.getOrders({ page: 1, limit: 20 });
 * 
 * // Create order
 * const order = await apiClient.createOrder({
 *   details: [{ service_id, equipment_id, issue_id }],
 * });
 * ```
 * 
 * @see {@link ../../docs/OPENAPI_CLIENT.md} for full documentation
 */

export { apiClient, ApiClient } from './client';
export type * from './types';
