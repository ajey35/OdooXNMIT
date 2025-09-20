import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generatePagination, generateOrderNumber } from '../utils/helpers.js';
import prisma from '../lib/prisma.js';

const router = Router();

// @desc    Get all customer invoices
// @route   GET /api/customer-invoices
// @access  Private
router.get('/', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('paymentStatus').optional().isIn(['PAID', 'UNPAID', 'PARTIAL']).withMessage('Invalid payment status'),
  query('customerId').optional().isString().withMessage('Customer ID must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  validate
], async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const paymentStatus = req.query.paymentStatus as string;
    const customerId = req.query.customerId as string;
    const search = req.query.search as string;

    const where: any = {};

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const { offset, totalPages } = generatePagination(page, limit, 0);

    const [customerInvoices, total] = await Promise.all([
      prisma.customerInvoice.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true
            }
          },
          salesOrder: {
            select: {
              id: true,
              soNumber: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  type: true
                }
              },
              tax: {
                select: {
                  id: true,
                  name: true,
                  rate: true,
                  computationMethod: true
                }
              }
            }
          },
          invoicePayments: {
            select: {
              id: true,
              paymentDate: true,
              paymentMethod: true,
              amount: true,
              reference: true
            }
          }
        }
      }),
      prisma.customerInvoice.count({ where })
    ]);

    const pagination = generatePagination(page, limit, total);

    sendSuccess(res, 'Customer invoices retrieved successfully', customerInvoices, {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    });
  } catch (error) {
    console.error('Get customer invoices error:', error);
    sendError(res, 'Failed to retrieve customer invoices', 500);
  }
});

// @desc    Get customer invoice by ID
// @route   GET /api/customer-invoices/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const customerInvoice = await prisma.customerInvoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            address: true,
            city: true,
            state: true,
            pincode: true
          }
        },
        salesOrder: {
          select: {
            id: true,
            soNumber: true,
            soDate: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                type: true,
                hsnCode: true
              }
            },
            tax: {
              select: {
                id: true,
                name: true,
                rate: true,
                computationMethod: true
              }
            }
          }
        },
        invoicePayments: {
          select: {
            id: true,
            paymentDate: true,
            paymentMethod: true,
            amount: true,
            reference: true
          },
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!customerInvoice) {
      return sendError(res, 'Customer invoice not found', 404);
    }

    sendSuccess(res, 'Customer invoice retrieved successfully', customerInvoice);
  } catch (error) {
    console.error('Get customer invoice error:', error);
    sendError(res, 'Failed to retrieve customer invoice', 500);
  }
});

// @desc    Create new customer invoice
// @route   POST /api/customer-invoices
// @access  Private
router.post('/', [
  authenticate,
  body('customerId').isString().withMessage('Customer ID is required'),
  body('invoiceDate').isISO8601().withMessage('Invoice date must be a valid date'),
  body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
  body('salesOrderId').optional().isString().withMessage('Sales order ID must be a string'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isString().withMessage('Product ID is required'),
  body('items.*.quantity').isDecimal({ decimal_digits: '0,2' }).withMessage('Quantity must be a valid decimal'),
  body('items.*.unitPrice').isDecimal({ decimal_digits: '0,2' }).withMessage('Unit price must be a valid decimal'),
  body('items.*.taxId').optional().isString().withMessage('Tax ID must be a string'),
  validate
], async (req, res) => {
  try {
    const { customerId, invoiceDate, dueDate, salesOrderId, items } = req.body;

    // Verify customer exists
    const customer = await prisma.contact.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    // Verify sales order exists if provided
    if (salesOrderId) {
      const salesOrder = await prisma.salesOrder.findUnique({
        where: { id: salesOrderId }
      });

      if (!salesOrder) {
        return sendError(res, 'Sales order not found', 404);
      }
    }

    // Verify all products exist
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      return sendError(res, 'One or more products not found', 404);
    }

    // Verify taxes exist if provided
    const taxIds = items.filter((item: any) => item.taxId).map((item: any) => item.taxId);
    if (taxIds.length > 0) {
      const taxes = await prisma.tax.findMany({
        where: { id: { in: taxIds } }
      });

      if (taxes.length !== taxIds.length) {
        return sendError(res, 'One or more taxes not found', 404);
      }
    }

    // Generate invoice number
    const invoiceNumber = generateOrderNumber('CI');

    // Calculate totals
    let subtotal = 0;
    let totalTaxAmount = 0;

    const processedItems = items.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      const tax = item.taxId ? taxes.find(t => t.id === item.taxId) : null;

      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const itemSubtotal = quantity * unitPrice;

      let taxAmount = 0;
      if (tax) {
        taxAmount = (itemSubtotal * tax.rate.toNumber()) / 100;
      }

      const itemTotal = itemSubtotal + taxAmount;

      subtotal += itemSubtotal;
      totalTaxAmount += taxAmount;

      return {
        productId: item.productId,
        taxId: item.taxId || null,
        quantity,
        unitPrice,
        taxAmount,
        total: itemTotal
      };
    });

    const total = subtotal + totalTaxAmount;

    // Create customer invoice with items
    const customerInvoice = await prisma.customerInvoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        customerId,
        salesOrderId,
        subtotal,
        taxAmount: totalTaxAmount,
        total,
        items: {
          create: processedItems
        }
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
        salesOrder: {
          select: {
            id: true,
            soNumber: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            tax: {
              select: {
                id: true,
                name: true,
                rate: true,
                computationMethod: true
              }
            }
          }
        }
      }
    });

    sendSuccess(res, 'Customer invoice created successfully', customerInvoice, undefined, 201);
  } catch (error) {
    console.error('Create customer invoice error:', error);
    sendError(res, 'Failed to create customer invoice', 500);
  }
});

// @desc    Update customer invoice
// @route   PUT /api/customer-invoices/:id
// @access  Private
router.put('/:id', [
  authenticate,
  body('invoiceDate').optional().isISO8601().withMessage('Invoice date must be a valid date'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  body('paymentStatus').optional().isIn(['PAID', 'UNPAID', 'PARTIAL']).withMessage('Invalid payment status'),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if customer invoice exists
    const existingInvoice = await prisma.customerInvoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      return sendError(res, 'Customer invoice not found', 404);
    }

    const customerInvoice = await prisma.customerInvoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true
          }
        },
        salesOrder: {
          select: {
            id: true,
            soNumber: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            tax: {
              select: {
                id: true,
                name: true,
                rate: true,
                computationMethod: true
              }
            }
          }
        }
      }
    });

    sendSuccess(res, 'Customer invoice updated successfully', customerInvoice);
  } catch (error) {
    console.error('Update customer invoice error:', error);
    sendError(res, 'Failed to update customer invoice', 500);
  }
});

// @desc    Delete customer invoice
// @route   DELETE /api/customer-invoices/:id
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer invoice exists
    const customerInvoice = await prisma.customerInvoice.findUnique({
      where: { id }
    });

    if (!customerInvoice) {
      return sendError(res, 'Customer invoice not found', 404);
    }

    // Don't allow deleting if there are payments
    if (customerInvoice.paidAmount > 0) {
      return sendError(res, 'Cannot delete customer invoice with payments', 400);
    }

    await prisma.customerInvoice.delete({
      where: { id }
    });

    sendSuccess(res, 'Customer invoice deleted successfully');
  } catch (error) {
    console.error('Delete customer invoice error:', error);
    sendError(res, 'Failed to delete customer invoice', 500);
  }
});

// @desc    Get customer invoice statistics
// @route   GET /api/customer-invoices/stats
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalInvoices, paidInvoices, unpaidInvoices, partialInvoices, totalValue, paidValue] = await Promise.all([
      prisma.customerInvoice.count(),
      prisma.customerInvoice.count({ where: { paymentStatus: 'PAID' } }),
      prisma.customerInvoice.count({ where: { paymentStatus: 'UNPAID' } }),
      prisma.customerInvoice.count({ where: { paymentStatus: 'PARTIAL' } }),
      prisma.customerInvoice.aggregate({
        _sum: { total: true }
      }),
      prisma.customerInvoice.aggregate({
        _sum: { paidAmount: true }
      })
    ]);

    const pendingValue = (totalValue._sum.total || 0) - (paidValue._sum.paidAmount || 0);

    sendSuccess(res, 'Customer invoice statistics retrieved successfully', {
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      partialInvoices,
      totalValue: totalValue._sum.total || 0,
      paidValue: paidValue._sum.paidAmount || 0,
      pendingValue
    });
  } catch (error) {
    console.error('Get customer invoice stats error:', error);
    sendError(res, 'Failed to retrieve customer invoice statistics', 500);
  }
});

export default router;
