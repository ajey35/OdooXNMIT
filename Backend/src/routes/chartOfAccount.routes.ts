import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generatePagination } from '../utils/helpers.js';
import prisma from '../lib/prisma.js';

const router = Router();

// @desc    Get all chart of accounts
// @route   GET /api/chart-of-accounts
// @access  Private
router.get('/', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['ASSET', 'LIABILITY', 'EXPENSE', 'INCOME', 'EQUITY']).withMessage('Invalid account type'),
  query('parentId').optional().isString().withMessage('Parent ID must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  validate
], async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const parentId = req.query.parentId as string;
    const search = req.query.search as string;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (parentId) {
      where.parentId = parentId;
    } else if (parentId === 'null') {
      where.parentId = null;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    const { offset, totalPages } = generatePagination(page, limit, 0);

    const [accounts, total] = await Promise.all([
      prisma.chartOfAccount.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          children: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true
            }
          }
        }
      }),
      prisma.chartOfAccount.count({ where })
    ]);

    const pagination = generatePagination(page, limit, total);

    sendSuccess(res, 'Chart of accounts retrieved successfully', accounts, {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    });
  } catch (error) {
    console.error('Get chart of accounts error:', error);
    sendError(res, 'Failed to retrieve chart of accounts', 500);
  }
});

// @desc    Get account by ID
// @route   GET /api/chart-of-accounts/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const account = await prisma.chartOfAccount.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true
          }
        }
      }
    });

    if (!account) {
      return sendError(res, 'Account not found', 404);
    }

    sendSuccess(res, 'Account retrieved successfully', account);
  } catch (error) {
    console.error('Get account error:', error);
    sendError(res, 'Failed to retrieve account', 500);
  }
});

// @desc    Create new account
// @route   POST /api/chart-of-accounts
// @access  Private
router.post('/', [
  authenticate,
  body('name').trim().notEmpty().withMessage('Account name is required'),
  body('type').isIn(['ASSET', 'LIABILITY', 'EXPENSE', 'INCOME', 'EQUITY']).withMessage('Invalid account type'),
  body('code').optional().isString().withMessage('Code must be a string'),
  body('parentId').optional().isString().withMessage('Parent ID must be a string'),
  validate
], async (req, res) => {
  try {
    const { name, type, code, parentId } = req.body;

    // Check if account with same name already exists
    const existingAccount = await prisma.chartOfAccount.findFirst({
      where: { name }
    });

    if (existingAccount) {
      return sendError(res, 'Account with this name already exists', 400);
    }

    // Check if code is provided and if it already exists
    if (code) {
      const existingCode = await prisma.chartOfAccount.findFirst({
        where: { code }
      });

      if (existingCode) {
        return sendError(res, 'Account with this code already exists', 400);
      }
    }

    // Validate parent account if provided
    if (parentId) {
      const parentAccount = await prisma.chartOfAccount.findUnique({
        where: { id: parentId }
      });

      if (!parentAccount) {
        return sendError(res, 'Parent account not found', 404);
      }

      if (parentAccount.type !== type) {
        return sendError(res, 'Parent account must be of the same type', 400);
      }
    }

    const account = await prisma.chartOfAccount.create({
      data: {
        name,
        type: type as any,
        code,
        parentId
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true
          }
        }
      }
    });

    sendSuccess(res, 'Account created successfully', account, undefined, 201);
  } catch (error) {
    console.error('Create account error:', error);
    sendError(res, 'Failed to create account', 500);
  }
});

// @desc    Update account
// @route   PUT /api/chart-of-accounts/:id
// @access  Private
router.put('/:id', [
  authenticate,
  body('name').optional().trim().notEmpty().withMessage('Account name cannot be empty'),
  body('type').optional().isIn(['ASSET', 'LIABILITY', 'EXPENSE', 'INCOME', 'EQUITY']).withMessage('Invalid account type'),
  body('code').optional().isString().withMessage('Code must be a string'),
  body('parentId').optional().isString().withMessage('Parent ID must be a string'),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if account exists
    const existingAccount = await prisma.chartOfAccount.findUnique({
      where: { id }
    });

    if (!existingAccount) {
      return sendError(res, 'Account not found', 404);
    }

    // Check if name is being updated and if it already exists
    if (updateData.name && updateData.name !== existingAccount.name) {
      const nameExists = await prisma.chartOfAccount.findFirst({
        where: {
          name: updateData.name,
          id: { not: id }
        }
      });

      if (nameExists) {
        return sendError(res, 'Account with this name already exists', 400);
      }
    }

    // Check if code is being updated and if it already exists
    if (updateData.code && updateData.code !== existingAccount.code) {
      const codeExists = await prisma.chartOfAccount.findFirst({
        where: {
          code: updateData.code,
          id: { not: id }
        }
      });

      if (codeExists) {
        return sendError(res, 'Account with this code already exists', 400);
      }
    }

    // Validate parent account if provided
    if (updateData.parentId) {
      if (updateData.parentId === id) {
        return sendError(res, 'Account cannot be its own parent', 400);
      }

      const parentAccount = await prisma.chartOfAccount.findUnique({
        where: { id: updateData.parentId }
      });

      if (!parentAccount) {
        return sendError(res, 'Parent account not found', 404);
      }

      const accountType = updateData.type || existingAccount.type;
      if (parentAccount.type !== accountType) {
        return sendError(res, 'Parent account must be of the same type', 400);
      }
    }

    const account = await prisma.chartOfAccount.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true
          }
        }
      }
    });

    sendSuccess(res, 'Account updated successfully', account);
  } catch (error) {
    console.error('Update account error:', error);
    sendError(res, 'Failed to update account', 500);
  }
});

// @desc    Delete account
// @route   DELETE /api/chart-of-accounts/:id
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if account exists
    const account = await prisma.chartOfAccount.findUnique({
      where: { id }
    });

    if (!account) {
      return sendError(res, 'Account not found', 404);
    }

    // Check if account has children
    const hasChildren = await prisma.chartOfAccount.findFirst({
      where: { parentId: id }
    });

    if (hasChildren) {
      return sendError(res, 'Cannot delete account with child accounts', 400);
    }

    // Check if account has ledger entries
    const hasLedgerEntries = await prisma.ledgerEntry.findFirst({
      where: { accountId: id }
    });

    if (hasLedgerEntries) {
      return sendError(res, 'Cannot delete account with existing transactions', 400);
    }

    await prisma.chartOfAccount.delete({
      where: { id }
    });

    sendSuccess(res, 'Account deleted successfully');
  } catch (error) {
    console.error('Delete account error:', error);
    sendError(res, 'Failed to delete account', 500);
  }
});

// @desc    Get accounts by type
// @route   GET /api/chart-of-accounts/by-type/:type
// @access  Private
router.get('/by-type/:type', [
  authenticate,
  validate
], async (req, res) => {
  try {
    const { type } = req.params;

    if (!['ASSET', 'LIABILITY', 'EXPENSE', 'INCOME', 'EQUITY'].includes(type)) {
      return sendError(res, 'Invalid account type', 400);
    }

    const accounts = await prisma.chartOfAccount.findMany({
      where: { type: type as any },
      orderBy: { name: 'asc' },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    sendSuccess(res, `${type} accounts retrieved successfully`, accounts);
  } catch (error) {
    console.error('Get accounts by type error:', error);
    sendError(res, 'Failed to retrieve accounts by type', 500);
  }
});

// @desc    Get account hierarchy
// @route   GET /api/chart-of-accounts/hierarchy
// @access  Private
router.get('/hierarchy', authenticate, async (req, res) => {
  try {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        children: {
          orderBy: { name: 'asc' },
          include: {
            children: {
              orderBy: { name: 'asc' }
            }
          }
        }
      }
    });

    sendSuccess(res, 'Account hierarchy retrieved successfully', accounts);
  } catch (error) {
    console.error('Get account hierarchy error:', error);
    sendError(res, 'Failed to retrieve account hierarchy', 500);
  }
});

// @desc    Get account statistics
// @route   GET /api/chart-of-accounts/stats
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalAccounts, assets, liabilities, expenses, income, equity] = await Promise.all([
      prisma.chartOfAccount.count(),
      prisma.chartOfAccount.count({ where: { type: 'ASSET' } }),
      prisma.chartOfAccount.count({ where: { type: 'LIABILITY' } }),
      prisma.chartOfAccount.count({ where: { type: 'EXPENSE' } }),
      prisma.chartOfAccount.count({ where: { type: 'INCOME' } }),
      prisma.chartOfAccount.count({ where: { type: 'EQUITY' } })
    ]);

    sendSuccess(res, 'Account statistics retrieved successfully', {
      totalAccounts,
      assets,
      liabilities,
      expenses,
      income,
      equity
    });
  } catch (error) {
    console.error('Get account stats error:', error);
    sendError(res, 'Failed to retrieve account statistics', 500);
  }
});

export default router;
