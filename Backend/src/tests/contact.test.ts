import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import app from '../index.js';
import prisma from '../lib/prisma.js';

// Test logging utility
const log = (message: string, data?: any) => {
  console.log(`🧪 [CONTACT TEST] ${message}`);
  if (data) {
    console.log('   📊 Data:', JSON.stringify(data, null, 2));
  }
};

describe('Contact Routes', () => {
  let authToken: string;
  let testUser: any;
  let testContact: any;

  beforeAll(async () => {
    log('🚀 Starting contact test setup');
    
    // Create test user
    log('👤 Creating test user');
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        loginId: 'testuser',
        password: 'hashedpassword',
        role: 'INVOICING_USER'
      }
    });
    testUser = user;
    log('✅ Test user created', { userId: user.id, email: user.email });

    // Generate auth token (simplified for testing)
    authToken = 'test-token';
    log('🔑 Auth token set for testing');
  });

  afterAll(async () => {
    log('🧹 Starting contact test cleanup');
    
    // Clean up test data
    if (testContact) {
      log(`🗑️ Deleting test contact: ${testContact.name}`);
      await prisma.contact.delete({
        where: { id: testContact.id }
      });
      log('✅ Test contact deleted');
    }
    
    if (testUser) {
      log(`🗑️ Deleting test user: ${testUser.email}`);
      await prisma.user.delete({
        where: { id: testUser.id }
      });
      log('✅ Test user deleted');
    }
    
    log('🏁 Contact test cleanup completed');
  });

  describe('POST /api/contacts', () => {
    it('should create a new contact successfully', async () => {
      log('📝 Testing contact creation');
      
      const contactData = {
        name: 'Test Contact',
        type: 'CUSTOMER',
        email: 'contact@example.com',
        mobile: '9876543210',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      };

      log('📤 Sending contact creation request', contactData);

      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(201);

      log('📥 Received contact creation response', {
        status: response.status,
        success: response.body.success,
        contactId: response.body.data?.id,
        contactName: response.body.data?.name
      });

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: contactData.name,
        type: contactData.type,
        email: contactData.email
      });

      testContact = response.body.data;
      log('✅ Contact creation test passed', { contactId: testContact.id });
    });

    it('should fail to create contact with invalid data', async () => {
      const contactData = {
        name: '',
        type: 'INVALID_TYPE',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/contacts', () => {
    it('should get all contacts', async () => {
      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter contacts by type', async () => {
      const response = await request(app)
        .get('/api/contacts?type=CUSTOMER')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((contact: any) => contact.type === 'CUSTOMER')).toBe(true);
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('should get contact by ID', async () => {
      const response = await request(app)
        .get(`/api/contacts/${testContact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testContact.id);
    });

    it('should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .get('/api/contacts/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/contacts/:id', () => {
    it('should update contact successfully', async () => {
      const updateData = {
        name: 'Updated Contact Name',
        city: 'Delhi'
      };

      const response = await request(app)
        .put(`/api/contacts/${testContact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.city).toBe(updateData.city);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should delete contact successfully', async () => {
      const response = await request(app)
        .delete(`/api/contacts/${testContact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
