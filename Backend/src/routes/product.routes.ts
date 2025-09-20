import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generatePagination } from '../utils/helpers.js';
import prisma from '../lib/prisma.js';

const router = Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Private
router.get('/', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['GOODS', 'SERVICE']).withMessage('Invalid product type'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  validate
], async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { hsnCode: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    const { offset, totalPages } = generatePagination(page, limit, 0);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    const pagination = generatePagination(page, limit, total);

    sendSuccess(res, 'Products retrieved successfully', products, {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    });
  } catch (error) {
    console.error('Get products error:', error);
    sendError(res, 'Failed to retrieve products', 500);
  }
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    sendSuccess(res, 'Product retrieved successfully', product);
  } catch (error) {
    console.error('Get product error:', error);
    sendError(res, 'Failed to retrieve product', 500);
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private
router.post('/', [
  authenticate,
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('type').isIn(['GOODS', 'SERVICE']).withMessage('Invalid product type'),
  body('salesPrice').isDecimal({ decimal_digits: '0,2' }).withMessage('Sales price must be a valid decimal'),
  body('purchasePrice').isDecimal({ decimal_digits: '0,2' }).withMessage('Purchase price must be a valid decimal'),
  body('salesTaxPercent').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Sales tax percent must be a valid decimal'),
  body('purchaseTaxPercent').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Purchase tax percent must be a valid decimal'),
  body('hsnCode').optional().isString().withMessage('HSN code must be a string'),
  body('category').optional().isString().withMessage('Category must be a string'),
  validate
], async (req, res) => {
  try {
    const {
      name,
      type,
      salesPrice,
      purchasePrice,
      salesTaxPercent,
      purchaseTaxPercent,
      hsnCode,
      category
    } = req.body;

    // Check if product with same name already exists
    const existingProduct = await prisma.product.findFirst({
      where: { name }
    });

    if (existingProduct) {
      return sendError(res, 'Product with this name already exists', 400);
    }

    const product = await prisma.product.create({
      data: {
        name,
        type: type as any,
        salesPrice: parseFloat(salesPrice),
        purchasePrice: parseFloat(purchasePrice),
        salesTaxPercent: salesTaxPercent ? parseFloat(salesTaxPercent) : null,
        purchaseTaxPercent: purchaseTaxPercent ? parseFloat(purchaseTaxPercent) : null,
        hsnCode,
        category
      }
    });

    sendSuccess(res, 'Product created successfully', product, undefined, 201);
  } catch (error) {
    console.error('Create product error:', error);
    sendError(res, 'Failed to create product', 500);
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
router.put('/:id', [
  authenticate,
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('type').optional().isIn(['GOODS', 'SERVICE']).withMessage('Invalid product type'),
  body('salesPrice').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Sales price must be a valid decimal'),
  body('purchasePrice').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Purchase price must be a valid decimal'),
  body('salesTaxPercent').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Sales tax percent must be a valid decimal'),
  body('purchaseTaxPercent').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Purchase tax percent must be a valid decimal'),
  body('hsnCode').optional().isString().withMessage('HSN code must be a string'),
  body('category').optional().isString().withMessage('Category must be a string'),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return sendError(res, 'Product not found', 404);
    }

    // Check if name is being updated and if it already exists
    if (updateData.name && updateData.name !== existingProduct.name) {
      const nameExists = await prisma.product.findFirst({
        where: {
          name: updateData.name,
          id: { not: id }
        }
      });

      if (nameExists) {
        return sendError(res, 'Product with this name already exists', 400);
      }
    }

    // Convert string numbers to decimal
    if (updateData.salesPrice) updateData.salesPrice = parseFloat(updateData.salesPrice);
    if (updateData.purchasePrice) updateData.purchasePrice = parseFloat(updateData.purchasePrice);
    if (updateData.salesTaxPercent) updateData.salesTaxPercent = parseFloat(updateData.salesTaxPercent);
    if (updateData.purchaseTaxPercent) updateData.purchaseTaxPercent = parseFloat(updateData.purchaseTaxPercent);

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });

    sendSuccess(res, 'Product updated successfully', product);
  } catch (error) {
    console.error('Update product error:', error);
    sendError(res, 'Failed to update product', 500);
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    // Check if product has any transactions
    const hasTransactions = await prisma.purchaseOrderItem.findFirst({
      where: { productId: id }
    }) || await prisma.salesOrderItem.findFirst({
      where: { productId: id }
    }) || await prisma.vendorBillItem.findFirst({
      where: { productId: id }
    }) || await prisma.customerInvoiceItem.findFirst({
      where: { productId: id }
    });

    if (hasTransactions) {
      return sendError(res, 'Cannot delete product with existing transactions', 400);
    }

    await prisma.product.delete({
      where: { id }
    });

    sendSuccess(res, 'Product deleted successfully');
  } catch (error) {
    console.error('Delete product error:', error);
    sendError(res, 'Failed to delete product', 500);
  }
});

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Private
router.get('/categories', authenticate, async (req, res) => {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      where: {
        category: { not: null }
      }
    });

    const categoryList = categories
      .map(item => item.category)
      .filter(Boolean)
      .sort();

    sendSuccess(res, 'Product categories retrieved successfully', categoryList);
  } catch (error) {
    console.error('Get product categories error:', error);
    sendError(res, 'Failed to retrieve product categories', 500);
  }
});

// @desc    Get product statistics
// @route   GET /api/products/stats
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalProducts, goods, services] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { type: 'GOODS' } }),
      prisma.product.count({ where: { type: 'SERVICE' } })
    ]);

    sendSuccess(res, 'Product statistics retrieved successfully', {
      totalProducts,
      goods,
      services
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    sendError(res, 'Failed to retrieve product statistics', 500);
  }
});

// @desc    Bulk update products
// @route   PUT /api/products/bulk-update
// @access  Private
router.put('/bulk-update', [
  authenticate,
  body('products').isArray().withMessage('Products must be an array'),
  body('products.*.id').isString().withMessage('Product ID is required'),
  validate
], async (req, res) => {
  try {
    const { products } = req.body;

    const updatePromises = products.map((product: any) => {
      const { id, ...updateData } = product;
      
      // Convert string numbers to decimal
      if (updateData.salesPrice) updateData.salesPrice = parseFloat(updateData.salesPrice);
      if (updateData.purchasePrice) updateData.purchasePrice = parseFloat(updateData.purchasePrice);
      if (updateData.salesTaxPercent) updateData.salesTaxPercent = parseFloat(updateData.salesTaxPercent);
      if (updateData.purchaseTaxPercent) updateData.purchaseTaxPercent = parseFloat(updateData.purchaseTaxPercent);

      return prisma.product.update({
        where: { id },
        data: updateData
      });
    });

    const updatedProducts = await Promise.all(updatePromises);

    sendSuccess(res, 'Products updated successfully', updatedProducts);
  } catch (error) {
    console.error('Bulk update products error:', error);
    sendError(res, 'Failed to update products', 500);
  }
});

export default router;
