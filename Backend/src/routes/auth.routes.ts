import { Router } from 'express';
import type { Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { hashPassword, comparePassword, generateToken, generateRefreshToken } from '../utils/helpers.js';
import prisma from '../lib/prisma.js';
import { sendOTPEmail } from '../utils/email.js';

const router = Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register',
   validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('loginId').trim().notEmpty().withMessage('Login ID is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['ADMIN', 'INVOICING_USER', 'CONTACT']).withMessage('Invalid role')
  ]),
 async (req: Request, res: Response) => {
  try {
    const { name, email, loginId, password, role = 'INVOICING_USER' } = req.body;
    console.log("req.body",req.body);
    console.log("prisma",prisma);
    
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
// router.post('/register', async (req: Request, res: Response) => {
//   console.log('Request received at /register');
//   try {
//     const { name, email, loginId, password, role = 'INVOICING_USER' } = req.body;
//     console.log('Body:', req.body);

//     const existingUser = await prisma.user.findFirst({
//       where: { OR: [{ email }, { loginId }] }
//     });
//     console.log('Existing user check done:', existingUser);

//     const hashedPassword = await hashPassword(password);
//     console.log('Password hashed');

//     const user = await prisma.user.create({
//       data: { name, email, loginId, password: hashedPassword, role: role as any },
//       select: { id: true, name: true, email: true, loginId: true, role: true, status: true, createdAt: true }
//     });
//     console.log('User created:', user);

//     const token = generateToken({ id: user.id, email: user.email, role: user.role });
//     const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });
//     console.log('Tokens generated');

//     res.json({ user, token, refreshToken });
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ error: 'Registration failed' });
//   }
// });

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validate([
  body('loginId').trim().notEmpty().withMessage('Login ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
]),async (req: Request, res: Response) => {
  try {
    const { loginId, password } = req.body;
    console.log("inside",loginId);
    

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
    console.log("fuck user",user);
    

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
router.put('/profile',  authenticate,validate([
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
]), async (req: AuthRequest, res: Response) => {
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
router.put('/change-password', authenticate,validate([
        
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
]), async (req: AuthRequest, res: Response) => {

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
router.get('/users', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
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
router.put('/users/:id/status', authenticate, authorize('ADMIN'), validate([
  body('status').isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']).withMessage('Invalid status'),
]), async (req: Request, res: Response) => {

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
// @desc    Request forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', validate([
  body('email').isEmail().withMessage('Valid email is required')
]), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return sendError(res, 'Email not registered', 404);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry (10 min)
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    // Save OTP & expiry
    await prisma.user.update({
      where: { email },
      data: { otp, otpExpiry: expiry }
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    sendSuccess(res, 'OTP sent to email', null);
  } catch (error) {
    console.error('Forgot password error:', error);
    sendError(res, 'Failed to send OTP', 500);
  }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
]), async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return sendError(res, 'Email not registered', 404);

    if (!user?.otp || !user?.otpExpiry) return sendError(res, 'No OTP requested', 400);

    const now = new Date();
    if (user.otp !== otp || user.otpExpiry < now) {
      return sendError(res, 'Invalid or expired OTP', 400);
    }

    sendSuccess(res, 'OTP verified successfully', null);
  } catch (error) {
    console.error('Verify OTP error:', error);
    sendError(res, 'Failed to verify OTP', 500);
  }
});

// @desc    Reset password after OTP
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
]), async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return sendError(res, 'Email not registered', 404);

    if (!user.otp || !user.otpExpiry) return sendError(res, 'No OTP requested', 400);

    const now = new Date();
    if (user.otp !== otp || user.otpExpiry < now) {
      return sendError(res, 'Invalid or expired OTP', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and remove OTP
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, otp: null, otpExpiry: null }
    });

    sendSuccess(res, 'Password reset successfully');
  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, 'Failed to reset password', 500);
  }
});


export default router;
