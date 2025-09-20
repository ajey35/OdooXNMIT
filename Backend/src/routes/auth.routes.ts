import { Router } from 'express';
import type { Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { hashPassword, comparePassword, generateToken, generateRefreshToken } from '../utils/helpers.js';
import prisma from '../lib/prisma.js';

const router = Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('loginId').trim().notEmpty().withMessage('Login ID is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['ADMIN', 'INVOICING_USER', 'CONTACT']).withMessage('Invalid role'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { name, email, loginId, password, role = 'INVOICING_USER' } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { loginId }
        ]
      }
    });

    if (existingUser) {
      return sendError(res, 'User with this email or login ID already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        loginId,
        password: hashedPassword,
        role: role as any
      },
      select: {
        id: true,
        name: true,
        email: true,
        loginId: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    // Generate tokens
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    sendSuccess(res, 'User registered successfully', {
      user,
      token,
      refreshToken
    }, undefined, 201);
  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, 'Registration failed', 500);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('loginId').trim().notEmpty().withMessage('Login ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { loginId, password } = req.body;

    // Find user by loginId or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { loginId },
          { email: loginId }
        ]
      }
    });

    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return sendError(res, 'Account is not active', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Generate tokens
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    sendSuccess(res, 'Login successful', {
      user: userWithoutPassword,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed', 500);
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        loginId: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, 'User retrieved successfully', user);
  } catch (error) {
    console.error('Get user error:', error);
    sendError(res, 'Failed to retrieve user', 500);
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', [
  authenticate,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  validate
], async (req: AuthRequest, res: Response) => {
  try {
    const { name, email } = req.body;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        loginId: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    sendSuccess(res, 'Profile updated successfully', user);
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, 'Failed to update profile', 500);
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', [
  authenticate,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
], async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedNewPassword }
    });

    sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 'Failed to change password', 500);
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private (Admin)
router.get('/users', [authenticate, authorize('ADMIN')], async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          loginId: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, 'Users retrieved successfully', users, {
      page,
      limit,
      total,
      totalPages
    });
  } catch (error) {
    console.error('Get users error:', error);
    sendError(res, 'Failed to retrieve users', 500);
  }
});

// @desc    Update user status (Admin only)
// @route   PUT /api/auth/users/:id/status
// @access  Private (Admin)
router.put('/users/:id/status', [
  authenticate,
  authorize('ADMIN'),
  body('status').isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']).withMessage('Invalid status'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status: status as any },
      select: {
        id: true,
        name: true,
        email: true,
        loginId: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    sendSuccess(res, 'User status updated successfully', user);
  } catch (error) {
    console.error('Update user status error:', error);
    sendError(res, 'Failed to update user status', 500);
  }
});

export default router;
