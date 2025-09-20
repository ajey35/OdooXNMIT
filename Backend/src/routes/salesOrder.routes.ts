import { Router, type Request, type Response } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generatePagination, generateOrderNumber, calculateTax, calculateTotal } from '../utils/helpers.js';
import prisma from '../lib/prisma.js';

const router = Router();

// @desc    Get all sales orders
// @route   GET /api/sales-orders
// @access  Private
router.get('/', 
  authenticate,validate([query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isString().withMessage('Status must be a string'),
    query('customerId').optional().isString().withMessage('Customer ID must be a string'),
    query('search').optional().isString().withMessage('Search must be a string'),])
  
  
, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const customerId = req.query.customerId as string;
    const search = req.query.search as string;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { soNumber: { contains: search, mode: 'insensitive' } },
        { soRef: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const { offset, totalPages } = generatePagination(page, limit, 0);

    const [salesOrders, total] = await Promise.all([
      prisma.salesOrder.findMany({
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
      }),
      prisma.salesOrder.count({ where })
    ]);

    const pagination = generatePagination(page, limit, total);

    sendSuccess(res, 'Sales orders retrieved successfully', salesOrders, {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    });
  } catch (error) {
    console.error('Get sales orders error:', error);
    sendError(res, 'Failed to retrieve sales orders', 500);
  }
});

// @desc    Get sales order by ID
// @route   GET /api/sales-orders/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const salesOrder = await prisma.salesOrder.findUnique({
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
        }
      }
    });

    if (!salesOrder) {
      return sendError(res, 'Sales order not found', 404);
    }

    sendSuccess(res, 'Sales order retrieved successfully', salesOrder);
  } catch (error) {
    console.error('Get sales order error:', error);
    sendError(res, 'Failed to retrieve sales order', 500);
  }
});

// @desc    Create new sales order
// @route   POST /api/sales-orders
// @access  Private
router.post('/', authenticate, validate([
  body('customerId').isString().withMessage('Customer ID is required'),
  body('soDate').isISO8601().withMessage('SO date must be a valid date'),
  body('soRef').optional().isString().withMessage('SO reference must be a string'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isString().withMessage('Product ID is required'),
  body('items.*.quantity').isDecimal({ decimal_digits: '0,2' }).withMessage('Quantity must be a valid decimal'),
  body('items.*.unitPrice').isDecimal({ decimal_digits: '0,2' }).withMessage('Unit price must be a valid decimal'),
  body('items.*.taxId').optional().isString().withMessage('Tax ID must be a string'),
]), async (req: Request, res: Response) => {
  try {
    const { customerId, soDate, soRef, items } = req.body;

    // Verify customer exists
    const customer = await prisma.contact.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return sendError(res, 'Customer not found', 404);
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
    let taxes: any[] = [];
    if (taxIds.length > 0) {
      taxes = await prisma.tax.findMany({
        where: { id: { in: taxIds } }
      });

      if (taxes.length !== taxIds.length) {
        return sendError(res, 'One or more taxes not found', 404);
      }
    }

    // Generate SO number
    const soNumber = generateOrderNumber('SO');

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
        taxAmount = calculateTax(itemSubtotal, tax.rate.toNumber(), tax.computationMethod);
      }

      const itemTotal = calculateTotal(itemSubtotal, taxAmount);

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

    const total = calculateTotal(subtotal, totalTaxAmount);

    // Create sales order with items
    const salesOrder = await prisma.salesOrder.create({
      data: {
        soNumber,
        soDate: new Date(soDate),
        customerId,
        soRef,
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

    sendSuccess(res, 'Sales order created successfully', salesOrder, undefined, 201);
  } catch (error) {
    console.error('Create sales order error:', error);
    sendError(res, 'Failed to create sales order', 500);
  }
});

// @desc    Update sales order
// @route   PUT /api/sales-orders/:id
// @access  Private
router.put('/:id', 
  authenticate,validate([body('soDate').optional().isISO8601().withMessage('SO date must be a valid date'),
    body('soRef').optional().isString().withMessage('SO reference must be a string'),
    body('status').optional().isString().withMessage('Status must be a string'),])
, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if sales order exists
    const existingSO = await prisma.salesOrder.findUnique({
      where: { id }
    });

    if (!existingSO) {
      return sendError(res, 'Sales order not found', 404);
    }

    // Don't allow updating if already converted to invoice
    if (existingSO.status === 'CONVERTED') {
      return sendError(res, 'Cannot update converted sales order', 400);
    }

    const salesOrder = await prisma.salesOrder.update({
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

    sendSuccess(res, 'Sales order updated successfully', salesOrder);
  } catch (error) {
    console.error('Update sales order error:', error);
    sendError(res, 'Failed to update sales order', 500);
  }
});

// @desc    Delete sales order
// @route   DELETE /api/sales-orders/:id
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if sales order exists
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id }
    });

    if (!salesOrder) {
      return sendError(res, 'Sales order not found', 404);
    }

    // Don't allow deleting if already converted to invoice
    if (salesOrder.status === 'CONVERTED') {
      return sendError(res, 'Cannot delete converted sales order', 400);
    }

    await prisma.salesOrder.delete({
      where: { id }
    });

    sendSuccess(res, 'Sales order deleted successfully');
  } catch (error) {
    console.error('Delete sales order error:', error);
    sendError(res, 'Failed to delete sales order', 500);
  }
});

// @desc    Convert sales order to customer invoice
// @route   POST /api/sales-orders/:id/convert-to-invoice
// @access  Private
router.post('/:id/convert-to-invoice', 
  authenticate,validate([body('invoiceDate').isISO8601().withMessage('Invoice date must be a valid date'),
  body('dueDate').isISO8601().withMessage('Due date must be a valid date'),])
  
  
, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { invoiceDate, dueDate } = req.body;

    // Get sales order with items
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!salesOrder) {
      return sendError(res, 'Sales order not found', 404);
    }

    if (salesOrder.status === 'CONVERTED') {
      return sendError(res, 'Sales order already converted to invoice', 400);
    }

    // Generate invoice number
    const invoiceNumber = generateOrderNumber('CI');

    // Create customer invoice
    const customerInvoice = await prisma.customerInvoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        customerId: salesOrder.customerId,
        salesOrderId: salesOrder.id,
        subtotal: salesOrder.subtotal,
        taxAmount: salesOrder.taxAmount,
        total: salesOrder.total,
        items: {
          create: salesOrder.items.map(item => ({
            productId: item.productId,
            taxId: item.taxId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxAmount: item.taxAmount,
            total: item.total
          }))
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

    // Update sales order status
    await prisma.salesOrder.update({
      where: { id },
      data: { status: 'CONVERTED' }
    });

    sendSuccess(res, 'Sales order converted to customer invoice successfully', customerInvoice, undefined, 201);
  } catch (error) {
    console.error('Convert SO to invoice error:', error);
    sendError(res, 'Failed to convert sales order to invoice', 500);
  }
});

// @desc    Get sales order statistics
// @route   GET /api/sales-orders/stats
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalSOs, draftSOs, convertedSOs, totalValue] = await Promise.all([
      prisma.salesOrder.count(),
      prisma.salesOrder.count({ where: { status: 'DRAFT' } }),
      prisma.salesOrder.count({ where: { status: 'CONVERTED' } }),
      prisma.salesOrder.aggregate({
        _sum: { total: true }
      })
    ]);

    sendSuccess(res, 'Sales order statistics retrieved successfully', {
      totalSOs,
      draftSOs,
      convertedSOs,
      totalValue: totalValue._sum.total || 0
    });
  } catch (error) {
    console.error('Get SO stats error:', error);
    sendError(res, 'Failed to retrieve sales order statistics', 500);
  }
});

export default router;
