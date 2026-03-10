/**
 * Auto-generated API Client
 * 
 * Type-safe API client for HDD Fixer backend.
 * Run 'npm run generate:api' to regenerate from OpenAPI spec.
 */

import api from '../api';
import type {
  // Auth
  RegisterRequest,
  AuthResponse,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  // Client
  ClientEntity,
  CreateClientRequest,
  UpdateClientRequest,
  // Order
  OrderEntity,
  CreateOrderRequest,
  UpdateOrderRequest,
  SetPriceRequest,
  AssignMasterRequest,
  RejectPriceRequest,
  OrderLifecycleEntity,
  PriceHistoryEntity,
  // Payment
  PaymentEntity,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  RefundRequest,
  // User
  UserEntity,
  UpdateUserRequest,
  // Equipment
  EquipmentEntity,
  ServiceEntity,
  IssueEntity,
  // Stats
  OrderStats,
  FinancialReport,
  SlaReport,
  // Common
  PaginationParams,
  ApiResponse,
} from './types';

// ===== API Client Class =====

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/v1') {
    this.baseUrl = baseUrl;
  }

  // ===== Orders =====

  async getOrders(params?: PaginationParams) {
    return api.get<ApiResponse<OrderEntity[]>>(`${this.baseUrl}/orders`, { params });
  }

  async getOrder(id: string) {
    return api.get<ApiResponse<OrderEntity>>(`${this.baseUrl}/orders/${id}`);
  }

  async createOrder(data: CreateOrderRequest) {
    return api.post<ApiResponse<OrderEntity>>(`${this.baseUrl}/orders`, data);
  }

  async updateOrder(id: string, data: UpdateOrderRequest) {
    return api.patch<ApiResponse<OrderEntity>>(`${this.baseUrl}/orders/${id}`, data);
  }

  async acceptOrder(id: string) {
    return api.post<ApiResponse<OrderEntity>>(`${this.baseUrl}/orders/${id}/accept`);
  }

  async rejectOrder(id: string) {
    return api.post<ApiResponse<OrderEntity>>(`${this.baseUrl}/orders/${id}/reject`);
  }

  async setPrice(id: string, data: SetPriceRequest) {
    return api.post<ApiResponse<OrderEntity>>(`${this.baseUrl}/orders/${id}/set-price`, data);
  }

  async updatePrice(id: string, data: SetPriceRequest) {
    return api.post<ApiResponse<OrderEntity>>(`${this.baseUrl}/orders/${id}/update-price`, data);
  }

  async approvePrice(id: string) {
    return api.post<ApiResponse<OrderEntity>>(`${this.baseUrl}/orders/${id}/approve-price`);
  }

  async rejectPrice(id: string, data: RejectPriceRequest) {
    return api.post<ApiResponse<OrderEntity>>(`${this.baseUrl}/orders/${id}/reject-price`, data);
  }

  async assignMaster(id: string, data: AssignMasterRequest) {
    return api.post<ApiResponse<OrderEntity>>(`${this.baseUrl}/orders/${id}/assign-master`, data);
  }

  async assignMasterToOrder(id: string, data: { master_id: string }) {
    return api.post<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/orders/${id}/assign-master-to-order`, data);
  }

  async getOrderLifecycle(id: string) {
    return api.get<ApiResponse<OrderLifecycleEntity[]>>(`${this.baseUrl}/orders/${id}/lifecycle`);
  }

  async getPriceHistory(id: string) {
    return api.get<ApiResponse<PriceHistoryEntity[]>>(`${this.baseUrl}/orders/${id}/price-history`);
  }

  async addLifecycleEntry(id: string, data: { comments: string; order_details_id?: string }) {
    return api.post<ApiResponse<OrderLifecycleEntity>>(`${this.baseUrl}/orders/${id}/lifecycle`, data);
  }

  // ===== Payments =====

  async createPayment(orderId: string, data: CreatePaymentRequest) {
    return api.post<ApiResponse<PaymentEntity | PaymentEntity[]>>(`${this.baseUrl}/orders/${orderId}/payments`, data);
  }

  async updatePayment(paymentId: string, data: UpdatePaymentRequest) {
    return api.patch<ApiResponse<PaymentEntity>>(`${this.baseUrl}/payments/${paymentId}`, data);
  }

  async refundPayment(paymentId: string, data: RefundRequest) {
    return api.post<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/payments/refund/${paymentId}`, data);
  }

  async getDailyRevenue(days: number = 30) {
    return api.get<ApiResponse<{ date: string; amount: number }[]>>(`${this.baseUrl}/payments/daily-revenue`, { params: { days } });
  }

  // ===== Users =====

  async getCurrentUser() {
    return api.get<ApiResponse<UserEntity>>(`${this.baseUrl}/users/me`);
  }

  async updateCurrentUser(data: UpdateUserRequest) {
    return api.patch<ApiResponse<UserEntity>>(`${this.baseUrl}/users/me`, data);
  }

  async getUserSettings() {
    return api.get<ApiResponse<any>>(`${this.baseUrl}/users/me/settings`);
  }

  async updateUserSettings(settings: any) {
    return api.patch<ApiResponse<any>>(`${this.baseUrl}/users/me/settings`, settings);
  }

  async getMasters() {
    return api.get<ApiResponse<UserEntity[]>>(`${this.baseUrl}/users/masters`);
  }

  async getUsers(params?: PaginationParams) {
    return api.get<ApiResponse<UserEntity[]>>(`${this.baseUrl}/users`, { params });
  }

  async getUser(id: string) {
    return api.get<ApiResponse<UserEntity>>(`${this.baseUrl}/users/${id}`);
  }

  async createUser(data: any) {
    return api.post<ApiResponse<UserEntity>>(`${this.baseUrl}/users`, data);
  }

  async updateUser(id: string, data: UpdateUserRequest) {
    return api.patch<ApiResponse<UserEntity>>(`${this.baseUrl}/users/${id}`, data);
  }

  async changeUserRole(userId: string, data: { role_id: string }) {
    return api.post<ApiResponse<UserEntity>>(`${this.baseUrl}/users/${userId}/role`, data);
  }

  async deleteUser(id: string) {
    return api.delete<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/users/${id}`);
  }

  // ===== Auth =====

  async login(data: LoginRequest) {
    return api.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/auth/login`, data);
  }

  async register(data: RegisterRequest) {
    return api.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/auth/register`, data);
  }

  async logout() {
    return api.post<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/auth/logout`);
  }

  async forgotPassword(data: ForgotPasswordRequest) {
    return api.post<ApiResponse<{ success: boolean; message: string }>>(`${this.baseUrl}/auth/forgot-password`, data);
  }

  async resetPassword(data: ResetPasswordRequest) {
    return api.post<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/auth/reset-password`, data);
  }

  async refreshToken() {
    return api.post<ApiResponse<{ access_token: string; refresh_token: string }>>(`${this.baseUrl}/auth/refresh`);
  }

  // ===== Equipment/Services/Issues =====

  async getEquipments(params?: PaginationParams) {
    return api.get<ApiResponse<EquipmentEntity[]>>(`${this.baseUrl}/equipments`, { params });
  }

  async getEquipment(id: string) {
    return api.get<ApiResponse<EquipmentEntity>>(`${this.baseUrl}/equipments/${id}`);
  }

  async createEquipment(data: any) {
    return api.post<ApiResponse<EquipmentEntity>>(`${this.baseUrl}/equipments`, data);
  }

  async updateEquipment(id: string, data: any) {
    return api.patch<ApiResponse<EquipmentEntity>>(`${this.baseUrl}/equipments/${id}`, data);
  }

  async deleteEquipment(id: string) {
    return api.delete<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/equipments/${id}`);
  }

  async getServices(params?: PaginationParams) {
    return api.get<ApiResponse<ServiceEntity[]>>(`${this.baseUrl}/services`, { params });
  }

  async getService(id: string) {
    return api.get<ApiResponse<ServiceEntity>>(`${this.baseUrl}/services/${id}`);
  }

  async createService(data: any) {
    return api.post<ApiResponse<ServiceEntity>>(`${this.baseUrl}/services`, data);
  }

  async updateService(id: string, data: any) {
    return api.patch<ApiResponse<ServiceEntity>>(`${this.baseUrl}/services/${id}`, data);
  }

  async deleteService(id: string) {
    return api.delete<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/services/${id}`);
  }

  async getIssues(params?: PaginationParams) {
    return api.get<ApiResponse<IssueEntity[]>>(`${this.baseUrl}/issues`, { params });
  }

  async getIssue(id: string) {
    return api.get<ApiResponse<IssueEntity>>(`${this.baseUrl}/issues/${id}`);
  }

  async createIssue(data: any) {
    return api.post<ApiResponse<IssueEntity>>(`${this.baseUrl}/issues`, data);
  }

  async updateIssue(id: string, data: any) {
    return api.patch<ApiResponse<IssueEntity>>(`${this.baseUrl}/issues/${id}`, data);
  }

  async deleteIssue(id: string) {
    return api.delete<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/issues/${id}`);
  }

  // ===== Clients =====

  async getClients(params?: PaginationParams) {
    return api.get<ApiResponse<ClientEntity[]>>(`${this.baseUrl}/clients`, { params });
  }

  async getClient(id: string) {
    return api.get<ApiResponse<ClientEntity>>(`${this.baseUrl}/clients/${id}`);
  }

  async createClient(data: CreateClientRequest) {
    return api.post<ApiResponse<ClientEntity>>(`${this.baseUrl}/clients`, data);
  }

  async updateClient(id: string, data: UpdateClientRequest) {
    return api.patch<ApiResponse<ClientEntity>>(`${this.baseUrl}/clients/${id}`, data);
  }

  async deleteClient(id: string) {
    return api.delete<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/clients/${id}`);
  }

  // ===== Stats & Reports =====

  async getOrderStats(period?: 'today' | 'week' | 'month') {
    return api.get<ApiResponse<OrderStats>>(`${this.baseUrl}/orders/stats`, { params: { period } });
  }

  async getFinancialReport(startDate?: string, endDate?: string) {
    return api.get<ApiResponse<FinancialReport>>(`${this.baseUrl}/payments/financial-report`, {
      params: { startDate, endDate },
    });
  }

  async getSlaReport(startDate?: string, endDate?: string) {
    return api.get<ApiResponse<SlaReport>>(`${this.baseUrl}/orders/sla`, {
      params: { startDate, endDate },
    });
  }

  // ===== Public Tracking =====

  async trackOrderByToken(token: string) {
    return api.get<ApiResponse<OrderEntity>>(`${this.baseUrl}/orders/track/${token}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
