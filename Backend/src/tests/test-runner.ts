import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import app from '../index.js';
import prisma from '../lib/prisma.js';

// Enhanced test logging utility
const log = (testName: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`\n[${timestamp}] 🧪 [${testName}] ${message}`);
  if (data) {
    console.log('   📊 Data:', JSON.stringify(data, null, 2));
  }
};

// Test summary tracking
let testSummary = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now()
};

const updateSummary = (passed: boolean) => {
  testSummary.total++;
  if (passed) {
    testSummary.passed++;
  } else {
    testSummary.failed++;
  }
};

const printSummary = () => {
  const duration = ((Date.now() - testSummary.startTime) / 1000).toFixed(2);
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📈 Total Tests: ${testSummary.total}`);
  console.log(`✅ Passed: ${testSummary.passed}`);
  console.log(`❌ Failed: ${testSummary.failed}`);
  console.log(`📊 Success Rate: ${((testSummary.passed / testSummary.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
};

describe('🚀 Shiv Accounts Cloud - Complete API Test Suite', () => {
  let authToken: string;
  let testUser: any;
  let testContact: any;
  let testProduct: any;

  beforeAll(async () => {
    log('SETUP', '🚀 Starting comprehensive test suite setup');
    
    // Clean up any existing test data
    log('SETUP', '🧹 Cleaning up existing test data');
    const cleanup = await Promise.all([
      prisma.user.deleteMany({ where: { email: { contains: 'test@' } } }),
      prisma.contact.deleteMany({ where: { email: { contains: 'test@' } } }),
      prisma.product.deleteMany({ where: { name: { contains: 'Test' } } })
    ]);
    
    log('SETUP', '✅ Cleanup completed', {
      usersDeleted: cleanup[0].count,
      contactsDeleted: cleanup[1].count,
      productsDeleted: cleanup[2].count
    });
  });

  afterAll(async () => {
    log('CLEANUP', '🧹 Starting test cleanup');
    
    // Clean up test data
    const cleanup = [];
    if (testContact) {
      cleanup.push(prisma.contact.delete({ where: { id: testContact.id } }));
    }
    if (testProduct) {
      cleanup.push(prisma.product.delete({ where: { id: testProduct.id } }));
    }
    if (testUser) {
      cleanup.push(prisma.user.delete({ where: { id: testUser.id } }));
    }
    
    if (cleanup.length > 0) {
      await Promise.all(cleanup);
      log('CLEANUP', '✅ Test data cleaned up');
    }
    
    printSummary();
  });

  describe('🔐 Authentication Tests', () => {
    it('should register a new user successfully', async () => {
      log('AUTH', '📝 Testing user registration');
      
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        loginId: 'testuser',
        password: 'password123',
        role: 'INVOICING_USER'
      };

      log('AUTH', '📤 Sending registration request', userData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      log('AUTH', '📥 Registration response received', {
        status: response.status,
        success: response.body.success,
        hasToken: !!response.body.data?.token
      });

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        name: userData.name,
        email: userData.email,
        role: userData.role
      });

      testUser = response.body.data.user;
      authToken = response.body.data.token;
      
      log('AUTH', '✅ User registration successful', {
        userId: testUser.id,
        tokenLength: authToken.length
      });
      
      updateSummary(true);
    });

    it('should login with valid credentials', async () => {
      log('AUTH', '🔐 Testing user login');
      
      const loginData = {
        loginId: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      log('AUTH', '📥 Login response received', {
        status: response.status,
        success: response.body.success,
        userEmail: response.body.data?.user?.email
      });

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      
      log('AUTH', '✅ User login successful');
      updateSummary(true);
    });

    it('should get current user with valid token', async () => {
      log('AUTH', '👤 Testing get current user');
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      log('AUTH', '📥 User data response received', {
        status: response.status,
        success: response.body.success,
        userEmail: response.body.data?.email
      });

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      
      log('AUTH', '✅ Get current user successful');
      updateSummary(true);
    });
  });

  describe('👥 Contact Management Tests', () => {
    it('should create a new contact successfully', async () => {
      log('CONTACT', '📝 Testing contact creation');
      
      const contactData = {
        name: 'Test Contact',
        type: 'CUSTOMER',
        email: 'contact@example.com',
        mobile: '9876543210',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      };

      log('CONTACT', '📤 Sending contact creation request', contactData);

      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(201);

      log('CONTACT', '📥 Contact creation response received', {
        status: response.status,
        success: response.body.success,
        contactId: response.body.data?.id
      });

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: contactData.name,
        type: contactData.type,
        email: contactData.email
      });

      testContact = response.body.data;
      
      log('CONTACT', '✅ Contact creation successful', {
        contactId: testContact.id,
        contactName: testContact.name
      });
      
      updateSummary(true);
    });

    it('should get all contacts', async () => {
      log('CONTACT', '📋 Testing get all contacts');
      
      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      log('CONTACT', '📥 Contacts list response received', {
        status: response.status,
        success: response.body.success,
        contactCount: response.body.data?.length || 0
      });

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      log('CONTACT', '✅ Get contacts successful', {
        totalContacts: response.body.data.length
      });
      
      updateSummary(true);
    });

    it('should get contact by ID', async () => {
      log('CONTACT', '🔍 Testing get contact by ID');
      
      const response = await request(app)
        .get(`/api/contacts/${testContact.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      log('CONTACT', '📥 Contact details response received', {
        status: response.status,
        success: response.body.success,
        contactId: response.body.data?.id
      });

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testContact.id);
      
      log('CONTACT', '✅ Get contact by ID successful');
      updateSummary(true);
    });
  });

  describe('📦 Product Management Tests', () => {
    it('should create a new product successfully', async () => {
      log('PRODUCT', '📝 Testing product creation');
      
      const productData = {
        name: 'Test Product',
        type: 'GOODS',
        salesPrice: 1000,
        purchasePrice: 750,
        salesTaxPercent: 18,
        purchaseTaxPercent: 18,
        hsnCode: '1234',
        category: 'Test Category'
      };

      log('PRODUCT', '📤 Sending product creation request', productData);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      log('PRODUCT', '📥 Product creation response received', {
        status: response.status,
        success: response.body.success,
        productId: response.body.data?.id
      });

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: productData.name,
        type: productData.type,
        salesPrice: productData.salesPrice
      });

      testProduct = response.body.data;
      
      log('PRODUCT', '✅ Product creation successful', {
        productId: testProduct.id,
        productName: testProduct.name
      });
      
      updateSummary(true);
    });

    it('should get all products', async () => {
      log('PRODUCT', '📋 Testing get all products');
      
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      log('PRODUCT', '📥 Products list response received', {
        status: response.status,
        success: response.body.success,
        productCount: response.body.data?.length || 0
      });

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      log('PRODUCT', '✅ Get products successful', {
        totalProducts: response.body.data.length
      });
      
      updateSummary(true);
    });
  });

  describe('📊 Dashboard Tests', () => {
    it('should get dashboard statistics', async () => {
      log('DASHBOARD', '📊 Testing dashboard statistics');
      
      const response = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      log('DASHBOARD', '📥 Dashboard response received', {
        status: response.status,
        success: response.body.success,
        hasSalesData: !!response.body.data?.sales,
        hasPurchaseData: !!response.body.data?.purchases
      });

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sales');
      expect(response.body.data).toHaveProperty('purchases');
      expect(response.body.data).toHaveProperty('profit');
      
      log('DASHBOARD', '✅ Dashboard statistics successful', {
        salesTotal: response.body.data.sales?.total?.amount || 0,
        purchasesTotal: response.body.data.purchases?.total?.amount || 0
      });
      
      updateSummary(true);
    });
  });

  describe('❌ Error Handling Tests', () => {
    it('should fail to access protected route without token', async () => {
      log('ERROR', '❌ Testing unauthorized access');
      
      const response = await request(app)
        .get('/api/contacts')
        .expect(401);

      log('ERROR', '📥 Unauthorized response received', {
        status: response.status,
        success: response.body.success,
        error: response.body.error
      });

      expect(response.body.success).toBe(false);
      
      log('ERROR', '✅ Unauthorized access correctly rejected');
      updateSummary(true);
    });

    it('should fail to create contact with invalid data', async () => {
      log('ERROR', '❌ Testing invalid data validation');
      
      const invalidData = {
        name: '',
        type: 'INVALID_TYPE',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      log('ERROR', '📥 Validation error response received', {
        status: response.status,
        success: response.body.success,
        error: response.body.error
      });

      expect(response.body.success).toBe(false);
      
      log('ERROR', '✅ Invalid data correctly rejected');
      updateSummary(true);
    });
  });
});
