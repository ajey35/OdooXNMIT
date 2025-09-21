import { Router, type Request, type Response } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generatePagination, generateOrderNumber, calculateTax, calculateTotal } from '../utils/helpers.js';
import prisma from '../lib/prisma.js';

const router = Router();

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private
router.get('/', authenticate, validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isString().withMessage('Status must be a string'),
  query('vendorId').optional().isString().withMessage('Vendor ID must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
]), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const vendorId = req.query.vendorId as string;
    const search = req.query.search as string;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { vendorRef: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const { offset, totalPages } = generatePagination(page, limit, 0);

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
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
      prisma.purchaseOrder.count({ where })
    ]);

    const pagination = generatePagination(page, limit, total);

    sendSuccess(res, 'Purchase orders retrieved successfully', purchaseOrders, {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    });
  } catch (error) {
    console.error('Get purchase orders error:', error);
    sendError(res, 'Failed to retrieve purchase orders', 500);
  }
});

// @desc    Get purchase order by ID
// @route   GET /api/purchase-orders/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
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

    if (!purchaseOrder) {
      return sendError(res, 'Purchase order not found', 404);
    }

    sendSuccess(res, 'Purchase order retrieved successfully', purchaseOrder);
  } catch (error) {
    console.error('Get purchase order error:', error);
    sendError(res, 'Failed to retrieve purchase order', 500);
  }
});

// @desc    Create new purchase order
// @route   POST /api/purchase-orders
// @access  Private
router.post('/', 
//   authenticate,validate([ body('vendorId').isString().withMessage('Vendor ID is required'),
//     body('poDate').isISO8601().withMessage('PO date must be a valid date'),
//     body('vendorRef').optional().isString().withMessage('Vendor reference must be a string'),
//     body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
//     body('items.*.productId').isString().withMessage('Product ID is required'),
//     body('items.*.quantity').isDecimal({ decimal_digits: '0,2' }).withMessage('Quantity must be a valid decimal'),
//     body('items.*.unitPrice').isDecimal({ decimal_digits: '0,2' }).withMessage('Unit price must be a valid decimal'),
//     body('items.*.taxId').optional().isString().withMessage('Tax ID must be a string'),])
//  ,
 async (req: Request, res: Response) => {
  try {
    const { vendorId, poDate, vendorRef, items } = req.body;

    // Verify vendor exists
    const vendor = await prisma.contact.findUnique({
      where: { id: vendorId }
    });

    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
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

    // Generate PO number
    const poNumber = generateOrderNumber('PO');

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

    // Create purchase order with items
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        poDate: new Date(poDate),
        vendorId,
        vendorRef,
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

    sendSuccess(res, 'Purchase order created successfully', purchaseOrder, undefined, 201);
  } catch (error) {
    console.error('Create purchase order error:', error);
    sendError(res, 'Failed to create purchase order', 500);
  }
});

// @desc    Update purchase order
// @route   PUT /api/purchase-orders/:id
// @access  Private
router.put('/:id', 
  authenticate,validate([ body('poDate').optional().isISO8601().withMessage('PO date must be a valid date'),
    body('vendorRef').optional().isString().withMessage('Vendor reference must be a string'),
    body('status').optional().isString().withMessage('Status must be a string'),])
, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if purchase order exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id }
    });

    if (!existingPO) {
      return sendError(res, 'Purchase order not found', 404);
    }

    // Don't allow updating if already converted to bill
    if (existingPO.status === 'CONVERTED') {
      return sendError(res, 'Cannot update converted purchase order', 400);
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
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

    sendSuccess(res, 'Purchase order updated successfully', purchaseOrder);
  } catch (error) {
    console.error('Update purchase order error:', error);
    sendError(res, 'Failed to update purchase order', 500);
  }
});

// @desc    Delete purchase order
// @route   DELETE /api/purchase-orders/:id
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if purchase order exists
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id }
    });

    if (!purchaseOrder) {
      return sendError(res, 'Purchase order not found', 404);
    }

    // Don't allow deleting if already converted to bill
    if (purchaseOrder.status === 'CONVERTED') {
      return sendError(res, 'Cannot delete converted purchase order', 400);
    }

    await prisma.purchaseOrder.delete({
      where: { id }
    });

    sendSuccess(res, 'Purchase order deleted successfully');
  } catch (error) {
    console.error('Delete purchase order error:', error);
    sendError(res, 'Failed to delete purchase order', 500);
  }
});

// @desc    Convert purchase order to vendor bill
// @route   POST /api/purchase-orders/:id/convert-to-bill
// @access  Private
router.post('/:id/convert-to-bill', 
  authenticate,validate([ body('billDate').isISO8601().withMessage('Bill date must be a valid date'),
    body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
    body('billReference').optional().isString().withMessage('Bill reference must be a string'),]) 
, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { billDate, dueDate, billReference } = req.body;

    // Get purchase order with items
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!purchaseOrder) {
      return sendError(res, 'Purchase order not found', 404);
    }

    if (purchaseOrder.status === 'CONVERTED') {
      return sendError(res, 'Purchase order already converted to bill', 400);
    }

    // Generate bill number
    const billNumber = generateOrderNumber('VB');

    // Create vendor bill
    const vendorBill = await prisma.vendorBill.create({
      data: {
        billNumber,
        billDate: new Date(billDate),
        dueDate: new Date(dueDate),
        vendorId: purchaseOrder.vendorId,
        purchaseOrderId: purchaseOrder.id,
        billReference,
        subtotal: purchaseOrder.subtotal,
        taxAmount: purchaseOrder.taxAmount,
        total: purchaseOrder.total,
        items: {
          create: purchaseOrder.items.map(item => ({
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
        vendor: {
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

    // Update purchase order status
    await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CONVERTED' }
    });

    sendSuccess(res, 'Purchase order converted to vendor bill successfully', vendorBill, undefined, 201);
  } catch (error) {
    console.error('Convert PO to bill error:', error);
    sendError(res, 'Failed to convert purchase order to bill', 500);
  }
});

// @desc    Get purchase order statistics
// @route   GET /api/purchase-orders/stats
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalPOs, draftPOs, convertedPOs, totalValue] = await Promise.all([
      prisma.purchaseOrder.count(),
      prisma.purchaseOrder.count({ where: { status: 'DRAFT' } }),
      prisma.purchaseOrder.count({ where: { status: 'CONVERTED' } }),
      prisma.purchaseOrder.aggregate({
        _sum: { total: true }
      })
    ]);

    sendSuccess(res, 'Purchase order statistics retrieved successfully', {
      totalPOs,
      draftPOs,
      convertedPOs,
      totalValue: totalValue._sum.total || 0
    });
  } catch (error) {
    console.error('Get PO stats error:', error);
    sendError(res, 'Failed to retrieve purchase order statistics', 500);
  }
});

export default router;
