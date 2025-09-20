import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generatePagination, generateOrderNumber } from '../utils/helpers.js';
import prisma from '../lib/prisma.js';

const router = Router();

// @desc    Get all vendor bills
// @route   GET /api/vendor-bills
// @access  Private
router.get('/', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('paymentStatus').optional().isIn(['PAID', 'UNPAID', 'PARTIAL']).withMessage('Invalid payment status'),
  query('vendorId').optional().isString().withMessage('Vendor ID must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  validate
], async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const paymentStatus = req.query.paymentStatus as string;
    const vendorId = req.query.vendorId as string;
    const search = req.query.search as string;

    const where: any = {};

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { billReference: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const { offset, totalPages } = generatePagination(page, limit, 0);

    const [vendorBills, total] = await Promise.all([
      prisma.vendorBill.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true
            }
          },
          purchaseOrder: {
            select: {
              id: true,
              poNumber: true
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
          billPayments: {
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
      prisma.vendorBill.count({ where })
    ]);

    const pagination = generatePagination(page, limit, total);

    sendSuccess(res, 'Vendor bills retrieved successfully', vendorBills, {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    });
  } catch (error) {
    console.error('Get vendor bills error:', error);
    sendError(res, 'Failed to retrieve vendor bills', 500);
  }
});

// @desc    Get vendor bill by ID
// @route   GET /api/vendor-bills/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const vendorBill = await prisma.vendorBill.findUnique({
      where: { id },
      include: {
        vendor: {
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
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            poDate: true
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
        billPayments: {
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

    if (!vendorBill) {
      return sendError(res, 'Vendor bill not found', 404);
    }

    sendSuccess(res, 'Vendor bill retrieved successfully', vendorBill);
  } catch (error) {
    console.error('Get vendor bill error:', error);
    sendError(res, 'Failed to retrieve vendor bill', 500);
  }
});

// @desc    Create new vendor bill
// @route   POST /api/vendor-bills
// @access  Private
router.post('/', [
  authenticate,
  body('vendorId').isString().withMessage('Vendor ID is required'),
  body('billDate').isISO8601().withMessage('Bill date must be a valid date'),
  body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
  body('purchaseOrderId').optional().isString().withMessage('Purchase order ID must be a string'),
  body('billReference').optional().isString().withMessage('Bill reference must be a string'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isString().withMessage('Product ID is required'),
  body('items.*.quantity').isDecimal({ decimal_digits: '0,2' }).withMessage('Quantity must be a valid decimal'),
  body('items.*.unitPrice').isDecimal({ decimal_digits: '0,2' }).withMessage('Unit price must be a valid decimal'),
  body('items.*.taxId').optional().isString().withMessage('Tax ID must be a string'),
  validate
], async (req, res) => {
  try {
    const { vendorId, billDate, dueDate, purchaseOrderId, billReference, items } = req.body;

    // Verify vendor exists
    const vendor = await prisma.contact.findUnique({
      where: { id: vendorId }
    });

    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    // Verify purchase order exists if provided
    if (purchaseOrderId) {
      const purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId }
      });

      if (!purchaseOrder) {
        return sendError(res, 'Purchase order not found', 404);
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

    // Generate bill number
    const billNumber = generateOrderNumber('VB');

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

    // Create vendor bill with items
    const vendorBill = await prisma.vendorBill.create({
      data: {
        billNumber,
        billDate: new Date(billDate),
        dueDate: new Date(dueDate),
        vendorId,
        purchaseOrderId,
        billReference,
        subtotal,
        taxAmount: totalTaxAmount,
        total,
        items: {
          create: processedItems
        }
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
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true
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

    sendSuccess(res, 'Vendor bill created successfully', vendorBill, undefined, 201);
  } catch (error) {
    console.error('Create vendor bill error:', error);
    sendError(res, 'Failed to create vendor bill', 500);
  }
});

// @desc    Update vendor bill
// @route   PUT /api/vendor-bills/:id
// @access  Private
router.put('/:id', [
  authenticate,
  body('billDate').optional().isISO8601().withMessage('Bill date must be a valid date'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  body('billReference').optional().isString().withMessage('Bill reference must be a string'),
  body('paymentStatus').optional().isIn(['PAID', 'UNPAID', 'PARTIAL']).withMessage('Invalid payment status'),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if vendor bill exists
    const existingBill = await prisma.vendorBill.findUnique({
      where: { id }
    });

    if (!existingBill) {
      return sendError(res, 'Vendor bill not found', 404);
    }

    const vendorBill = await prisma.vendorBill.update({
      where: { id },
      data: updateData,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true
          }
        },
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true
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

    sendSuccess(res, 'Vendor bill updated successfully', vendorBill);
  } catch (error) {
    console.error('Update vendor bill error:', error);
    sendError(res, 'Failed to update vendor bill', 500);
  }
});

// @desc    Delete vendor bill
// @route   DELETE /api/vendor-bills/:id
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vendor bill exists
    const vendorBill = await prisma.vendorBill.findUnique({
      where: { id }
    });

    if (!vendorBill) {
      return sendError(res, 'Vendor bill not found', 404);
    }

    // Don't allow deleting if there are payments
    if (vendorBill.paidAmount > 0) {
      return sendError(res, 'Cannot delete vendor bill with payments', 400);
    }

    await prisma.vendorBill.delete({
      where: { id }
    });

    sendSuccess(res, 'Vendor bill deleted successfully');
  } catch (error) {
    console.error('Delete vendor bill error:', error);
    sendError(res, 'Failed to delete vendor bill', 500);
  }
});

// @desc    Get vendor bill statistics
// @route   GET /api/vendor-bills/stats
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalBills, paidBills, unpaidBills, partialBills, totalValue, paidValue] = await Promise.all([
      prisma.vendorBill.count(),
      prisma.vendorBill.count({ where: { paymentStatus: 'PAID' } }),
      prisma.vendorBill.count({ where: { paymentStatus: 'UNPAID' } }),
      prisma.vendorBill.count({ where: { paymentStatus: 'PARTIAL' } }),
      prisma.vendorBill.aggregate({
        _sum: { total: true }
      }),
      prisma.vendorBill.aggregate({
        _sum: { paidAmount: true }
      })
    ]);

    const pendingValue = (totalValue._sum.total || 0) - (paidValue._sum.paidAmount || 0);

    sendSuccess(res, 'Vendor bill statistics retrieved successfully', {
      totalBills,
      paidBills,
      unpaidBills,
      partialBills,
      totalValue: totalValue._sum.total || 0,
      paidValue: paidValue._sum.paidAmount || 0,
      pendingValue
    });
  } catch (error) {
    console.error('Get vendor bill stats error:', error);
    sendError(res, 'Failed to retrieve vendor bill statistics', 500);
  }
});

export default router;
