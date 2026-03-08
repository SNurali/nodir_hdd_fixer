#!/usr/bin/env node

/**
 * OpenAPI Generator Script
 * 
 * Генерирует TypeScript клиент из OpenAPI спецификации
 * 
 * Использование:
 *   npm run generate:api
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3004';
const OPENAPI_JSON = path.join(__dirname, '../../openapi.json');
const CLIENT_OUTPUT_DIR = path.join(__dirname, '../../apps/web/src/lib/api-client');
const PACKAGE_JSON = path.join(__dirname, '../../package.json');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkOpenApiGenerator() {
    try {
        execSync('npx openapi-typescript --version', { stdio: 'pipe' });
        return true;
    } catch (error) {
        return false;
    }
}

async function fetchOpenApiSpec() {
    log('\n📥 Fetching OpenAPI specification...', 'blue');
    
    try {
        const response = await fetch(`${API_URL}/v1/api-json`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const spec = await response.json();
        fs.writeFileSync(OPENAPI_JSON, JSON.stringify(spec, null, 2));
        log(`✅ OpenAPI spec saved to ${OPENAPI_JSON}`, 'green');
        return spec;
    } catch (error) {
        log(`❌ Failed to fetch OpenAPI spec: ${error.message}`, 'red');
        log('\n💡 Make sure the API server is running on ' + API_URL, 'yellow');
        process.exit(1);
    }
}

async function generateTypes() {
    log('\n🔨 Generating TypeScript types...', 'blue');
    
    const typesOutput = path.join(CLIENT_OUTPUT_DIR, 'types.ts');
    
    try {
        // Create output directory if it doesn't exist
        if (!fs.existsSync(CLIENT_OUTPUT_DIR)) {
            fs.mkdirSync(CLIENT_OUTPUT_DIR, { recursive: true });
        }
        
        // Run openapi-typescript
        const cmd = `npx openapi-typescript ${OPENAPI_JSON} --output ${typesOutput}`;
        execSync(cmd, { stdio: 'inherit' });
        
        log(`✅ Types generated: ${typesOutput}`, 'green');
        return true;
    } catch (error) {
        log(`❌ Failed to generate types: ${error.message}`, 'red');
        return false;
    }
}

function generateClient() {
    log('\n🔧 Generating API client...', 'blue');
    
    const clientOutput = path.join(CLIENT_OUTPUT_DIR, 'client.ts');
    
    const clientCode = `/**
 * Auto-generated API Client
 * Do not edit manually. Run 'npm run generate:api' to regenerate.
 */

import api from '../api';
import type { paths } from './types';

export type { paths } from './types';

// Type helpers
type OperationIdMap = {
  [K in keyof paths['paths']]: {
    [M in keyof paths['paths'][K]]: paths['paths'][K][M] extends { operationId: infer O } ? O : never;
  };
};

// API Client class
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/v1') {
    this.baseUrl = baseUrl;
  }

  // ===== Orders =====

  async getOrders(params?: { page?: number; limit?: number }) {
    return api.get<paths['responses']['GetOrders']>(\`\${this.baseUrl}/orders\`, { params });
  }

  async getOrder(id: string) {
    return api.get<paths['responses']['GetOrder']>(\`\${this.baseUrl}/orders/\${id}\`);
  }

  async createOrder(data: paths['requestBodies']['CreateOrder']) {
    return api.post<paths['responses']['CreateOrder']>(\`\${this.baseUrl}/orders\`, data);
  }

  async updateOrder(id: string, data: paths['requestBodies']['UpdateOrder']) {
    return api.patch<paths['responses']['UpdateOrder']>(\`\${this.baseUrl}/orders/\${id}\`, data);
  }

  async acceptOrder(id: string) {
    return api.post<paths['responses']['AcceptOrder']>(\`\${this.baseUrl}/orders/\${id}/accept\`);
  }

  async rejectOrder(id: string) {
    return api.post<paths['responses']['RejectOrder']>(\`\${this.baseUrl}/orders/\${id}/reject\`);
  }

  async setPrice(id: string, data: paths['requestBodies']['SetPrice']) {
    return api.post<paths['responses']['SetPrice']>(\`\${this.baseUrl}/orders/\${id}/set-price\`, data);
  }

  async approvePrice(id: string) {
    return api.post<paths['responses']['ApprovePrice']>(\`\${this.baseUrl}/orders/\${id}/approve-price\`);
  }

  async rejectPrice(id: string, data: { reason: string }) {
    return api.post<paths['responses']['RejectPrice']>(\`\${this.baseUrl}/orders/\${id}/reject-price\`, data);
  }

  async assignMaster(id: string, data: { master_id: string; detail_id?: string }) {
    return api.post<paths['responses']['AssignMaster']>(\`\${this.baseUrl}/orders/\${id}/assign-master\`, data);
  }

  async getOrderLifecycle(id: string) {
    return api.get<paths['responses']['GetOrderLifecycle']>(\`\${this.baseUrl}/orders/\${id}/lifecycle\`);
  }

  async getPriceHistory(id: string) {
    return api.get<paths['responses']['GetPriceHistory']>(\`\${this.baseUrl}/orders/\${id}/price-history\`);
  }

  // ===== Payments =====

  async createPayment(orderId: string, data: paths['requestBodies']['CreatePayment']) {
    return api.post<paths['responses']['CreatePayment']>(\`\${this.baseUrl}/orders/\${orderId}/payments\`, data);
  }

  async updatePayment(paymentId: string, data: paths['requestBodies']['UpdatePayment']) {
    return api.patch<paths['responses']['UpdatePayment']>(\`\${this.baseUrl}/payments/\${paymentId}\`, data);
  }

  async refundPayment(paymentId: string, data: { reason: string }) {
    return api.post<paths['responses']['RefundPayment']>(\`\${this.baseUrl}/payments/refund/\${paymentId}\`, data);
  }

  // ===== Users =====

  async getCurrentUser() {
    return api.get<paths['responses']['GetCurrentUser']>(\`\${this.baseUrl}/users/me\`);
  }

  async updateCurrentUser(data: paths['requestBodies']['UpdateUser']) {
    return api.patch<paths['responses']['UpdateUser']>(\`\${this.baseUrl}/users/me\`, data);
  }

  async getMasters() {
    return api.get<paths['responses']['GetMasters']>(\`\${this.baseUrl}/users/masters\`);
  }

  // ===== Auth =====

  async login(data: paths['requestBodies']['Login']) {
    return api.post<paths['responses']['Login']>(\`\${this.baseUrl}/auth/login\`, data);
  }

  async register(data: paths['requestBodies']['Register']) {
    return api.post<paths['responses']['Register']>(\`\${this.baseUrl}/auth/register\`, data);
  }

  async logout() {
    return api.post<paths['responses']['Logout']>(\`\${this.baseUrl}/auth/logout\`);
  }

  async forgotPassword(data: { login: string }) {
    return api.post<paths['responses']['ForgotPassword']>(\`\${this.baseUrl}/auth/forgot-password\`, data);
  }

  async resetPassword(data: { token: string; new_password: string }) {
    return api.post<paths['responses']['ResetPassword']>(\`\${this.baseUrl}/auth/reset-password\`, data);
  }

  // ===== Equipment/Services/Issues =====

  async getEquipments() {
    return api.get<paths['responses']['GetEquipments']>(\`\${this.baseUrl}/equipments\`);
  }

  async getServices() {
    return api.get<paths['responses']['GetServices']>(\`\${this.baseUrl}/services\`);
  }

  async getIssues() {
    return api.get<paths['responses']['GetIssues']>(\`\${this.baseUrl}/issues\`);
  }

  // ===== Clients =====

  async getClients() {
    return api.get<paths['responses']['GetClients']>(\`\${this.baseUrl}/clients\`);
  }

  async getClient(id: string) {
    return api.get<paths['responses']['GetClient']>(\`\${this.baseUrl}/clients/\${id}\`);
  }

  async createClient(data: paths['requestBodies']['CreateClient']) {
    return api.post<paths['responses']['CreateClient']>(\`\${this.baseUrl}/clients\`, data);
  }

  async updateClient(id: string, data: paths['requestBodies']['UpdateClient']) {
    return api.patch<paths['responses']['UpdateClient']>(\`\${this.baseUrl}/clients/\${id}\`, data);
  }

  // ===== Stats =====

  async getOrderStats(period?: 'today' | 'week' | 'month') {
    return api.get<paths['responses']['GetOrderStats']>(\`\${this.baseUrl}/orders/stats\`, { 
      params: { period } 
    });
  }

  async getFinancialReport(startDate?: string, endDate?: string) {
    return api.get<paths['responses']['GetFinancialReport']>(\`\${this.baseUrl}/payments/financial-report\`, {
      params: { startDate, endDate }
    });
  }

  async getSlaReport(startDate?: string, endDate?: string) {
    return api.get<paths['responses']['GetSlaReport']>(\`\${this.baseUrl}/orders/sla\`, {
      params: { startDate, endDate }
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
`;

    fs.writeFileSync(clientOutput, clientCode);
    log(`✅ Client generated: ${clientOutput}`, 'green');
    return true;
}

function generateIndex() {
    log('\n📝 Generating index file...', 'blue');
    
    const indexOutput = path.join(CLIENT_OUTPUT_DIR, 'index.ts');
    
    const indexCode = `/**
 * Auto-generated API Client Index
 * Do not edit manually.
 */

export { apiClient, ApiClient } from './client';
export type { paths } from './types';
`;

    fs.writeFileSync(indexOutput, indexCode);
    log(`✅ Index generated: ${indexOutput}`, 'green');
    return true;
}

function updatePackageJson() {
    log('\n📦 Updating package.json...', 'blue');
    
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
    
    // Add dev dependencies if not present
    if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
    }
    
    if (!packageJson.devDependencies['openapi-typescript']) {
        packageJson.devDependencies['openapi-typescript'] = '^7.0.0';
        fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));
        log('⚠️  Run "npm install" to install new dependencies', 'yellow');
    }
    
    log('✅ package.json updated', 'green');
}

async function main() {
    log('\n🚀 OpenAPI Client Generator', 'blue');
    log('=========================\n', 'blue');
    
    // Check if openapi-typescript is installed
    if (!checkOpenApiGenerator()) {
        log('⚠️  openapi-typescript not found. Installing...', 'yellow');
        try {
            execSync('npm install -D openapi-typescript', { stdio: 'inherit' });
        } catch (error) {
            log('❌ Failed to install openapi-typescript', 'red');
            log('💡 Run: npm install -D openapi-typescript', 'yellow');
            process.exit(1);
        }
    }
    
    // Update package.json
    updatePackageJson();
    
    // Fetch OpenAPI spec from running API
    await fetchOpenApiSpec();
    
    // Generate TypeScript types
    const typesGenerated = await generateTypes();
    if (!typesGenerated) {
        process.exit(1);
    }
    
    // Generate API client
    const clientGenerated = generateClient();
    if (!clientGenerated) {
        process.exit(1);
    }
    
    // Generate index file
    generateIndex();
    
    log('\n✅ Generation complete!', 'green');
    log('\n📁 Generated files:', 'blue');
    log(`   - ${path.join(CLIENT_OUTPUT_DIR, 'types.ts')}`);
    log(`   - ${path.join(CLIENT_OUTPUT_DIR, 'client.ts')}`);
    log(`   - ${path.join(CLIENT_OUTPUT_DIR, 'index.ts')}`);
    log('\n💡 Usage:', 'yellow');
    log("   import { apiClient } from '@/lib/api-client';");
    log('   const orders = await apiClient.getOrders();');
    log('\n');
}

main().catch(error => {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
});
