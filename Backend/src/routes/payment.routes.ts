import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generatePagination } from '../utils/helpers.js';
import prisma from '../lib/prisma.js';

const router = Router();

// @desc    Get all bill payments
// @route   GET /api/payments/bill-payments
// @access  Private
router.get('/bill-payments', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('vendorId').optional().isString().withMessage('Vendor ID must be a string'),
  query('paymentMethod').optional().isIn(['CASH', 'BANK', 'CHEQUE', 'ONLINE']).withMessage('Invalid payment method'),
  query('search').optional().isString().withMessage('Search must be a string'),
  validate
], async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const vendorId = req.query.vendorId as string;
    const paymentMethod = req.query.paymentMethod as string;
    const search = req.query.search as string;

    const where: any = {};

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
        { vendorBill: { billNumber: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const { offset, totalPages } = generatePagination(page, limit, 0);

    const [billPayments, total] = await Promise.all([
      prisma.billPayment.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true
            }
          },
          vendorBill: {
            select: {
              id: true,
              billNumber: true,
              billDate: true,
              total: true
            }
          }
        }
      }),
      prisma.billPayment.count({ where })
    ]);

    const pagination = generatePagination(page, limit, total);

    sendSuccess(res, 'Bill payments retrieved successfully', billPayments, {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    });
  } catch (error) {
    console.error('Get bill payments error:', error);
    sendError(res, 'Failed to retrieve bill payments', 500);
  }
});

// @desc    Get all invoice payments
// @route   GET /api/payments/invoice-payments
// @access  Private
router.get('/invoice-payments', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('customerId').optional().isString().withMessage('Customer ID must be a string'),
  query('paymentMethod').optional().isIn(['CASH', 'BANK', 'CHEQUE', 'ONLINE']).withMessage('Invalid payment method'),
  query('search').optional().isString().withMessage('Search must be a string'),
  validate
], async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const customerId = req.query.customerId as string;
    const paymentMethod = req.query.paymentMethod as string;
    const search = req.query.search as string;

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customerInvoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const { offset, totalPages } = generatePagination(page, limit, 0);

    const [invoicePayments, total] = await Promise.all([
      prisma.invoicePayment.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true
            }
          },
          customerInvoice: {
            select: {
              id: true,
              invoiceNumber: true,
              invoiceDate: true,
              total: true
            }
          }
        }
      }),
      prisma.invoicePayment.count({ where })
    ]);

    const pagination = generatePagination(page, limit, total);

    sendSuccess(res, 'Invoice payments retrieved successfully', invoicePayments, {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    });
  } catch (error) {
    console.error('Get invoice payments error:', error);
    sendError(res, 'Failed to retrieve invoice payments', 500);
  }
});

// @desc    Create bill payment
// @route   POST /api/payments/bill-payments
// @access  Private
router.post('/bill-payments', [
  authenticate,
  body('paymentDate').isISO8601().withMessage('Payment date must be a valid date'),
  body('paymentMethod').isIn(['CASH', 'BANK', 'CHEQUE', 'ONLINE']).withMessage('Invalid payment method'),
  body('vendorId').isString().withMessage('Vendor ID is required'),
  body('vendorBillId').isString().withMessage('Vendor bill ID is required'),
  body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal'),
  body('reference').optional().isString().withMessage('Reference must be a string'),
  validate
], async (req, res) => {
  try {
    const { paymentDate, paymentMethod, vendorId, vendorBillId, amount, reference } = req.body;

    // Verify vendor exists
    const vendor = await prisma.contact.findUnique({
      where: { id: vendorId }
    });

    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    // Verify vendor bill exists
    const vendorBill = await prisma.vendorBill.findUnique({
      where: { id: vendorBillId }
    });

    if (!vendorBill) {
      return sendError(res, 'Vendor bill not found', 404);
    }

    // Verify vendor bill belongs to vendor
    if (vendorBill.vendorId !== vendorId) {
      return sendError(res, 'Vendor bill does not belong to this vendor', 400);
    }

    const paymentAmount = parseFloat(amount);

    // Check if payment amount exceeds remaining balance
    const remainingBalance = vendorBill.total.toNumber() - vendorBill.paidAmount.toNumber();
    if (paymentAmount > remainingBalance) {
      return sendError(res, 'Payment amount exceeds remaining balance', 400);
    }

    // Create bill payment
    const billPayment = await prisma.billPayment.create({
      data: {
        paymentDate: new Date(paymentDate),
        paymentMethod: paymentMethod as any,
        vendorId,
        vendorBillId,
        amount: paymentAmount,
        reference
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true
          }
        },
        vendorBill: {
          select: {
            id: true,
            billNumber: true,
            billDate: true,
            total: true
          }
        }
      }
    });

    // Update vendor bill paid amount and payment status
    const newPaidAmount = vendorBill.paidAmount.toNumber() + paymentAmount;
    let paymentStatus = 'PARTIAL';
    
    if (newPaidAmount >= vendorBill.total.toNumber()) {
      paymentStatus = 'PAID';
    }

    await prisma.vendorBill.update({
      where: { id: vendorBillId },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus: paymentStatus as any
      }
    });

    sendSuccess(res, 'Bill payment created successfully', billPayment, undefined, 201);
  } catch (error) {
    console.error('Create bill payment error:', error);
    sendError(res, 'Failed to create bill payment', 500);
  }
});

// @desc    Create invoice payment
// @route   POST /api/payments/invoice-payments
// @access  Private
router.post('/invoice-payments', [
  authenticate,
  body('paymentDate').isISO8601().withMessage('Payment date must be a valid date'),
  body('paymentMethod').isIn(['CASH', 'BANK', 'CHEQUE', 'ONLINE']).withMessage('Invalid payment method'),
  body('customerId').isString().withMessage('Customer ID is required'),
  body('customerInvoiceId').isString().withMessage('Customer invoice ID is required'),
  body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal'),
  body('reference').optional().isString().withMessage('Reference must be a string'),
  validate
], async (req, res) => {
  try {
    const { paymentDate, paymentMethod, customerId, customerInvoiceId, amount, reference } = req.body;

    // Verify customer exists
    const customer = await prisma.contact.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    // Verify customer invoice exists
    const customerInvoice = await prisma.customerInvoice.findUnique({
      where: { id: customerInvoiceId }
    });

    if (!customerInvoice) {
      return sendError(res, 'Customer invoice not found', 404);
    }

    // Verify customer invoice belongs to customer
    if (customerInvoice.customerId !== customerId) {
      return sendError(res, 'Customer invoice does not belong to this customer', 400);
    }

    const paymentAmount = parseFloat(amount);

    // Check if payment amount exceeds remaining balance
    const remainingBalance = customerInvoice.total.toNumber() - customerInvoice.paidAmount.toNumber();
    if (paymentAmount > remainingBalance) {
      return sendError(res, 'Payment amount exceeds remaining balance', 400);
    }

    // Create invoice payment
    const invoicePayment = await prisma.invoicePayment.create({
      data: {
        paymentDate: new Date(paymentDate),
        paymentMethod: paymentMethod as any,
        customerId,
        customerInvoiceId,
        amount: paymentAmount,
        reference
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true
          }
        },
        customerInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            total: true
          }
        }
      }
    });

    // Update customer invoice paid amount and payment status
    const newPaidAmount = customerInvoice.paidAmount.toNumber() + paymentAmount;
    let paymentStatus = 'PARTIAL';
    
    if (newPaidAmount >= customerInvoice.total.toNumber()) {
      paymentStatus = 'PAID';
    }

    await prisma.customerInvoice.update({
      where: { id: customerInvoiceId },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus: paymentStatus as any
      }
    });

    sendSuccess(res, 'Invoice payment created successfully', invoicePayment, undefined, 201);
  } catch (error) {
    console.error('Create invoice payment error:', error);
    sendError(res, 'Failed to create invoice payment', 500);
  }
});

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [
      totalBillPayments,
      totalInvoicePayments,
      billPaymentAmount,
      invoicePaymentAmount,
      cashPayments,
      bankPayments,
      onlinePayments
    ] = await Promise.all([
      prisma.billPayment.count(),
      prisma.invoicePayment.count(),
      prisma.billPayment.aggregate({
        _sum: { amount: true }
      }),
      prisma.invoicePayment.aggregate({
        _sum: { amount: true }
      }),
      prisma.billPayment.count({ where: { paymentMethod: 'CASH' } }) +
      prisma.invoicePayment.count({ where: { paymentMethod: 'CASH' } }),
      prisma.billPayment.count({ where: { paymentMethod: 'BANK' } }) +
      prisma.invoicePayment.count({ where: { paymentMethod: 'BANK' } }),
      prisma.billPayment.count({ where: { paymentMethod: 'ONLINE' } }) +
      prisma.invoicePayment.count({ where: { paymentMethod: 'ONLINE' } })
    ]);

    sendSuccess(res, 'Payment statistics retrieved successfully', {
      totalBillPayments,
      totalInvoicePayments,
      totalPayments: totalBillPayments + totalInvoicePayments,
      billPaymentAmount: billPaymentAmount._sum.amount || 0,
      invoicePaymentAmount: invoicePaymentAmount._sum.amount || 0,
      totalPaymentAmount: (billPaymentAmount._sum.amount || 0) + (invoicePaymentAmount._sum.amount || 0),
      cashPayments,
      bankPayments,
      onlinePayments
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    sendError(res, 'Failed to retrieve payment statistics', 500);
  }
});

// @desc    Get payments by date range
// @route   GET /api/payments/by-date-range
// @access  Private
router.get('/by-date-range', [
  authenticate,
  query('startDate').isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').isISO8601().withMessage('End date must be a valid date'),
  query('type').optional().isIn(['bill', 'invoice', 'all']).withMessage('Type must be bill, invoice, or all'),
  validate
], async (req, res) => {
  try {
    const { startDate, endDate, type = 'all' } = req.query;

    const where = {
      paymentDate: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    };

    let billPayments = [];
    let invoicePayments = [];

    if (type === 'all' || type === 'bill') {
      billPayments = await prisma.billPayment.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true
            }
          },
          vendorBill: {
            select: {
              id: true,
              billNumber: true
            }
          }
        },
        orderBy: { paymentDate: 'desc' }
      });
    }

    if (type === 'all' || type === 'invoice') {
      invoicePayments = await prisma.invoicePayment.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true
            }
          },
          customerInvoice: {
            select: {
              id: true,
              invoiceNumber: true
            }
          }
        },
        orderBy: { paymentDate: 'desc' }
      });
    }

    sendSuccess(res, 'Payments retrieved successfully', {
      billPayments,
      invoicePayments,
      totalBillPayments: billPayments.length,
      totalInvoicePayments: invoicePayments.length
    });
  } catch (error) {
    console.error('Get payments by date range error:', error);
    sendError(res, 'Failed to retrieve payments by date range', 500);
  }
});

export default router;
