import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generatePagination } from '../utils/helpers.js';
import prisma from '../lib/prisma.js';

const router = Router();

// @desc    Get all taxes
// @route   GET /api/taxes
// @access  Private
router.get('/', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('computationMethod').optional().isIn(['PERCENTAGE', 'FIXED_VALUE']).withMessage('Invalid computation method'),
  query('applicableOnSales').optional().isBoolean().withMessage('Applicable on sales must be a boolean'),
  query('applicableOnPurchase').optional().isBoolean().withMessage('Applicable on purchase must be a boolean'),
  query('search').optional().isString().withMessage('Search must be a string'),
  validate
], async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const computationMethod = req.query.computationMethod as string;
    const applicableOnSales = req.query.applicableOnSales as string;
    const applicableOnPurchase = req.query.applicableOnPurchase as string;
    const search = req.query.search as string;

    const where: any = {};

    if (computationMethod) {
      where.computationMethod = computationMethod;
    }

    if (applicableOnSales !== undefined) {
      where.applicableOnSales = applicableOnSales === 'true';
    }

    if (applicableOnPurchase !== undefined) {
      where.applicableOnPurchase = applicableOnPurchase === 'true';
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const { offset, totalPages } = generatePagination(page, limit, 0);

    const [taxes, total] = await Promise.all([
      prisma.tax.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tax.count({ where })
    ]);

    const pagination = generatePagination(page, limit, total);

    sendSuccess(res, 'Taxes retrieved successfully', taxes, {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    });
  } catch (error) {
    console.error('Get taxes error:', error);
    sendError(res, 'Failed to retrieve taxes', 500);
  }
});

// @desc    Get tax by ID
// @route   GET /api/taxes/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const tax = await prisma.tax.findUnique({
      where: { id }
    });

    if (!tax) {
      return sendError(res, 'Tax not found', 404);
    }

    sendSuccess(res, 'Tax retrieved successfully', tax);
  } catch (error) {
    console.error('Get tax error:', error);
    sendError(res, 'Failed to retrieve tax', 500);
  }
});

// @desc    Create new tax
// @route   POST /api/taxes
// @access  Private
router.post('/', [
  authenticate,
  body('name').trim().notEmpty().withMessage('Tax name is required'),
  body('computationMethod').isIn(['PERCENTAGE', 'FIXED_VALUE']).withMessage('Invalid computation method'),
  body('rate').isDecimal({ decimal_digits: '0,2' }).withMessage('Rate must be a valid decimal'),
  body('applicableOnSales').optional().isBoolean().withMessage('Applicable on sales must be a boolean'),
  body('applicableOnPurchase').optional().isBoolean().withMessage('Applicable on purchase must be a boolean'),
  validate
], async (req, res) => {
  try {
    const {
      name,
      computationMethod,
      rate,
      applicableOnSales = true,
      applicableOnPurchase = true
    } = req.body;

    // Check if tax with same name already exists
    const existingTax = await prisma.tax.findFirst({
      where: { name }
    });

    if (existingTax) {
      return sendError(res, 'Tax with this name already exists', 400);
    }

    const tax = await prisma.tax.create({
      data: {
        name,
        computationMethod: computationMethod as any,
        rate: parseFloat(rate),
        applicableOnSales,
        applicableOnPurchase
      }
    });

    sendSuccess(res, 'Tax created successfully', tax, undefined, 201);
  } catch (error) {
    console.error('Create tax error:', error);
    sendError(res, 'Failed to create tax', 500);
  }
});

// @desc    Update tax
// @route   PUT /api/taxes/:id
// @access  Private
router.put('/:id', [
  authenticate,
  body('name').optional().trim().notEmpty().withMessage('Tax name cannot be empty'),
  body('computationMethod').optional().isIn(['PERCENTAGE', 'FIXED_VALUE']).withMessage('Invalid computation method'),
  body('rate').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Rate must be a valid decimal'),
  body('applicableOnSales').optional().isBoolean().withMessage('Applicable on sales must be a boolean'),
  body('applicableOnPurchase').optional().isBoolean().withMessage('Applicable on purchase must be a boolean'),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if tax exists
    const existingTax = await prisma.tax.findUnique({
      where: { id }
    });

    if (!existingTax) {
      return sendError(res, 'Tax not found', 404);
    }

    // Check if name is being updated and if it already exists
    if (updateData.name && updateData.name !== existingTax.name) {
      const nameExists = await prisma.tax.findFirst({
        where: {
          name: updateData.name,
          id: { not: id }
        }
      });

      if (nameExists) {
        return sendError(res, 'Tax with this name already exists', 400);
      }
    }

    // Convert string numbers to decimal
    if (updateData.rate) updateData.rate = parseFloat(updateData.rate);

    const tax = await prisma.tax.update({
      where: { id },
      data: updateData
    });

    sendSuccess(res, 'Tax updated successfully', tax);
  } catch (error) {
    console.error('Update tax error:', error);
    sendError(res, 'Failed to update tax', 500);
  }
});

// @desc    Delete tax
// @route   DELETE /api/taxes/:id
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tax exists
    const tax = await prisma.tax.findUnique({
      where: { id }
    });

    if (!tax) {
      return sendError(res, 'Tax not found', 404);
    }

    // Check if tax has any transactions
    const hasTransactions = await prisma.purchaseOrderItem.findFirst({
      where: { taxId: id }
    }) || await prisma.salesOrderItem.findFirst({
      where: { taxId: id }
    }) || await prisma.vendorBillItem.findFirst({
      where: { taxId: id }
    }) || await prisma.customerInvoiceItem.findFirst({
      where: { taxId: id }
    });

    if (hasTransactions) {
      return sendError(res, 'Cannot delete tax with existing transactions', 400);
    }

    await prisma.tax.delete({
      where: { id }
    });

    sendSuccess(res, 'Tax deleted successfully');
  } catch (error) {
    console.error('Delete tax error:', error);
    sendError(res, 'Failed to delete tax', 500);
  }
});

// @desc    Get taxes by type
// @route   GET /api/taxes/by-type/:type
// @access  Private
router.get('/by-type/:type', [
  authenticate,
  validate
], async (req, res) => {
  try {
    const { type } = req.params;

    if (!['sales', 'purchase'].includes(type)) {
      return sendError(res, 'Invalid type. Must be "sales" or "purchase"', 400);
    }

    const where = type === 'sales' 
      ? { applicableOnSales: true }
      : { applicableOnPurchase: true };

    const taxes = await prisma.tax.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    sendSuccess(res, `${type.charAt(0).toUpperCase() + type.slice(1)} taxes retrieved successfully`, taxes);
  } catch (error) {
    console.error('Get taxes by type error:', error);
    sendError(res, 'Failed to retrieve taxes by type', 500);
  }
});

// @desc    Get tax statistics
// @route   GET /api/taxes/stats
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalTaxes, percentageTaxes, fixedValueTaxes, salesTaxes, purchaseTaxes] = await Promise.all([
      prisma.tax.count(),
      prisma.tax.count({ where: { computationMethod: 'PERCENTAGE' } }),
      prisma.tax.count({ where: { computationMethod: 'FIXED_VALUE' } }),
      prisma.tax.count({ where: { applicableOnSales: true } }),
      prisma.tax.count({ where: { applicableOnPurchase: true } })
    ]);

    sendSuccess(res, 'Tax statistics retrieved successfully', {
      totalTaxes,
      percentageTaxes,
      fixedValueTaxes,
      salesTaxes,
      purchaseTaxes
    });
  } catch (error) {
    console.error('Get tax stats error:', error);
    sendError(res, 'Failed to retrieve tax statistics', 500);
  }
});

// @desc    Calculate tax amount
// @route   POST /api/taxes/calculate
// @access  Private
router.post('/calculate', [
  authenticate,
  body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal'),
  body('taxId').isString().withMessage('Tax ID is required'),
  validate
], async (req, res) => {
  try {
    const { amount, taxId } = req.body;

    const tax = await prisma.tax.findUnique({
      where: { id: taxId }
    });

    if (!tax) {
      return sendError(res, 'Tax not found', 404);
    }

    let taxAmount = 0;
    if (tax.computationMethod === 'PERCENTAGE') {
      taxAmount = (parseFloat(amount) * tax.rate.toNumber()) / 100;
    } else {
      taxAmount = tax.rate.toNumber();
    }

    const total = parseFloat(amount) + taxAmount;

    sendSuccess(res, 'Tax calculated successfully', {
      originalAmount: parseFloat(amount),
      taxAmount,
      total,
      tax: {
        id: tax.id,
        name: tax.name,
        rate: tax.rate.toNumber(),
        computationMethod: tax.computationMethod
      }
    });
  } catch (error) {
    console.error('Calculate tax error:', error);
    sendError(res, 'Failed to calculate tax', 500);
  }
});

export default router;
