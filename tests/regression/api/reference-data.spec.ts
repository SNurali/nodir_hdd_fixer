import { describe, it, expect, beforeAll } from 'vitest';
import { RegressionApiHelper, regressionExpect } from '../utils/api-helper';

/**
 * Regression Tests: Reference Data API
 * 
 * Tests for equipments, services, issues endpoints
 */

describe('Reference Data API Regression', () => {
  let api: RegressionApiHelper;
  
  beforeAll(async () => {
    api = new RegressionApiHelper();
    await api.registerAndLogin();
  });
  
  afterAll(() => {
    api.clearToken();
  });
  
  describe('GET /equipments', () => {
    it('should return list of equipments', async () => {
      const response = await api.getEquipments();
      
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(0);
      
      const equipment = response.data[0];
      expect(equipment).toHaveProperty('id');
      expect(equipment).toHaveProperty('name_rus');
      expect(equipment).toHaveProperty('name_eng');
    });
    
    it('should support pagination', async () => {
      const response = await api.request('/equipments?page=1&limit=10');
      
      regressionExpect.hasPagination(response);
      expect(response.data.length).toBeLessThanOrEqual(10);
    });
    
    it('should support search', async () => {
      const response = await api.request('/equipments?search=HDD');
      
      expect(response.data).toBeInstanceOf(Array);
      // All results should match search query
      response.data.forEach((item: any) => {
        const searchText = `${item.name_rus} ${item.name_eng}`.toLowerCase();
        expect(searchText).toContain('hdd');
      });
    });
  });
  
  describe('GET /services', () => {
    it('should return list of services', async () => {
      const response = await api.getServices();
      
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(0);
      
      const service = response.data[0];
      expect(service).toHaveProperty('id');
      expect(service).toHaveProperty('name_rus');
      expect(service).toHaveProperty('name_eng');
    });
    
    it('should support pagination', async () => {
      const response = await api.request('/services?page=1&limit=5');
      
      regressionExpect.hasPagination(response);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });
  });
  
  describe('GET /issues', () => {
    it('should return list of issues', async () => {
      const response = await api.getIssues();
      
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(0);
      
      const issue = response.data[0];
      expect(issue).toHaveProperty('id');
      expect(issue).toHaveProperty('name_rus');
      expect(issue).toHaveProperty('name_eng');
    });
    
    it('should support pagination', async () => {
      const response = await api.request('/issues?page=1&limit=10');
      
      regressionExpect.hasPagination(response);
    });
  });
  
  describe('GET /equipments/:id', () => {
    it('should return single equipment', async () => {
      const listResponse = await api.getEquipments();
      const equipmentId = listResponse.data[0].id;
      
      const response = await api.request(`/equipments/${equipmentId}`);
      
      expect(response.data).toHaveProperty('id', equipmentId);
      expect(response.data).toHaveProperty('name_rus');
      expect(response.data).toHaveProperty('name_eng');
    });
    
    it('should return 404 for non-existent equipment', async () => {
      await expect(
        api.request('/equipments/non-existent-id')
      ).rejects.toThrow('404');
    });
  });
  
  describe('GET /services/:id', () => {
    it('should return single service', async () => {
      const listResponse = await api.getServices();
      const serviceId = listResponse.data[0].id;
      
      const response = await api.request(`/services/${serviceId}`);
      
      expect(response.data).toHaveProperty('id', serviceId);
    });
  });
  
  describe('GET /issues/:id', () => {
    it('should return single issue', async () => {
      const listResponse = await api.getIssues();
      const issueId = listResponse.data[0].id;
      
      const response = await api.request(`/issues/${issueId}`);
      
      expect(response.data).toHaveProperty('id', issueId);
    });
  });
});
