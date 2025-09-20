import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import app from '../index.js';
import prisma from '../lib/prisma.js';

// Test logging utility
const log = (message: string, data?: any) => {
  console.log(`🧪 [AUTH TEST] ${message}`);
  if (data) {
    console.log('   📊 Data:', JSON.stringify(data, null, 2));
  }
};

describe('Authentication Routes', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    log('🚀 Starting test setup - cleaning up existing test data');
    
    // Clean up any existing test data
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test@'
        }
      }
    });
    
    log(`✅ Cleaned up ${deletedUsers.count} existing test users`);
  });

  afterAll(async () => {
    log('🧹 Starting test cleanup');
    
    // Clean up test data
    if (testUser) {
      log(`🗑️ Deleting test user: ${testUser.email}`);
      await prisma.user.delete({
        where: { id: testUser.id }
      });
      log('✅ Test user deleted successfully');
    }
    
    log('🏁 Test cleanup completed');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      log('📝 Testing user registration');
      
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        loginId: 'testuser',
        password: 'password123',
        role: 'INVOICING_USER'
      };

      log('📤 Sending registration request', userData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      log('📥 Received registration response', {
        status: response.status,
        success: response.body.success,
        hasToken: !!response.body.data?.token,
        hasRefreshToken: !!response.body.data?.refreshToken
      });

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        name: userData.name,
        email: userData.email,
        loginId: userData.loginId,
        role: userData.role
      });
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      testUser = response.body.data.user;
      authToken = response.body.data.token;
      
      log('✅ User registration test passed', {
        userId: testUser.id,
        userEmail: testUser.email,
        tokenLength: authToken.length
      });
    });

    it('should fail to register with duplicate email', async () => {
      log('❌ Testing duplicate email registration (should fail)');
      
      const userData = {
        name: 'Another User',
        email: 'test@example.com',
        loginId: 'anotheruser',
        password: 'password123'
      };

      log('📤 Sending duplicate email registration request', userData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      log('📥 Received error response', {
        status: response.status,
        success: response.body.success,
        error: response.body.error
      });

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
      
      log('✅ Duplicate email test passed - correctly rejected');
    });

    it('should fail to register with invalid data', async () => {
      log('❌ Testing invalid data registration (should fail)');
      
      const userData = {
        name: '',
        email: 'invalid-email',
        password: '123'
      };

      log('📤 Sending invalid data registration request', userData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      log('📥 Received validation error response', {
        status: response.status,
        success: response.body.success,
        error: response.body.error
      });

      expect(response.body.success).toBe(false);
      
      log('✅ Invalid data test passed - correctly rejected');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      log('🔐 Testing user login with valid credentials');
      
      const loginData = {
        loginId: 'test@example.com',
        password: 'password123'
      };

      log('📤 Sending login request', { loginId: loginData.loginId });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      log('📥 Received login response', {
        status: response.status,
        success: response.body.success,
        hasToken: !!response.body.data?.token,
        userEmail: response.body.data?.user?.email
      });

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: 'test@example.com'
      });
      expect(response.body.data.token).toBeDefined();
      
      log('✅ Login test passed');
    });

    it('should fail to login with invalid credentials', async () => {
      log('❌ Testing login with invalid credentials (should fail)');
      
      const loginData = {
        loginId: 'test@example.com',
        password: 'wrongpassword'
      };

      log('📤 Sending invalid login request', { loginId: loginData.loginId });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      log('📥 Received error response', {
        status: response.status,
        success: response.body.success,
        error: response.body.error
      });

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
      
      log('✅ Invalid credentials test passed - correctly rejected');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      log('👤 Testing get current user with valid token');
      
      log('📤 Sending authenticated request', { 
        hasToken: !!authToken,
        tokenLength: authToken?.length 
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`) 
        .expect(200);

      log('📥 Received user data response', {
        status: response.status,
        success: response.body.success,
        userEmail: response.body.data?.email,
        userRole: response.body.data?.role
      });

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        email: 'test@example.com'
      });
      
      log('✅ Get current user test passed');
    });

    it('should fail without token', async () => {
      log('❌ Testing get current user without token (should fail)');
      
      log('📤 Sending unauthenticated request');

      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      log('📥 Received unauthorized response', {
        status: response.status,
        success: response.body.success,
        error: response.body.error
      });

      expect(response.body.success).toBe(false);
      
      log('✅ Unauthorized access test passed - correctly rejected');
    });
  });
});
