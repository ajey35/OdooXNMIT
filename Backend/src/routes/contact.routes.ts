import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generatePagination } from '../utils/helpers.js';
import prisma from '../lib/prisma.js';

const router = Router();

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Private
router.get('/', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['CUSTOMER', 'VENDOR', 'BOTH']).withMessage('Invalid contact type'),
  query('search').optional().isString().withMessage('Search must be a string'),
  validate
], async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const search = req.query.search as string;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } }
      ];
    }

    const { offset, totalPages } = generatePagination(page, limit, 0);

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.contact.count({ where })
    ]);

    const pagination = generatePagination(page, limit, total);

    sendSuccess(res, 'Contacts retrieved successfully', contacts, {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    sendError(res, 'Failed to retrieve contacts', 500);
  }
});

// @desc    Get contact by ID
// @route   GET /api/contacts/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!contact) {
      return sendError(res, 'Contact not found', 404);
    }

    sendSuccess(res, 'Contact retrieved successfully', contact);
  } catch (error) {
    console.error('Get contact error:', error);
    sendError(res, 'Failed to retrieve contact', 500);
  }
});

// @desc    Create new contact
// @route   POST /api/contacts
// @access  Private
router.post('/', [
  authenticate,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['CUSTOMER', 'VENDOR', 'BOTH']).withMessage('Invalid contact type'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('mobile').optional().isMobilePhone('en-IN').withMessage('Please provide a valid mobile number'),
  body('city').optional().isString().withMessage('City must be a string'),
  body('state').optional().isString().withMessage('State must be a string'),
  body('pincode').optional().isPostalCode('IN').withMessage('Please provide a valid pincode'),
  body('address').optional().isString().withMessage('Address must be a string'),
  validate
], async (req, res) => {
  try {
    const {
      name,
      type,
      email,
      mobile,
      city,
      state,
      pincode,
      address
    } = req.body;

    // Check if contact with same email already exists
    if (email) {
      const existingContact = await prisma.contact.findFirst({
        where: { email }
      });

      if (existingContact) {
        return sendError(res, 'Contact with this email already exists', 400);
      }
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        type: type as any,
        email,
        mobile,
        city,
        state,
        pincode,
        address,
        createdById: req.user!.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    sendSuccess(res, 'Contact created successfully', contact, undefined, 201);
  } catch (error) {
    console.error('Create contact error:', error);
    sendError(res, 'Failed to create contact', 500);
  }
});

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
router.put('/:id', [
  authenticate,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('type').optional().isIn(['CUSTOMER', 'VENDOR', 'BOTH']).withMessage('Invalid contact type'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('mobile').optional().isMobilePhone('en-IN').withMessage('Please provide a valid mobile number'),
  body('city').optional().isString().withMessage('City must be a string'),
  body('state').optional().isString().withMessage('State must be a string'),
  body('pincode').optional().isPostalCode('IN').withMessage('Please provide a valid pincode'),
  body('address').optional().isString().withMessage('Address must be a string'),
  validate
], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if contact exists
    const existingContact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!existingContact) {
      return sendError(res, 'Contact not found', 404);
    }

    // Check if email is being updated and if it already exists
    if (updateData.email && updateData.email !== existingContact.email) {
      const emailExists = await prisma.contact.findFirst({
        where: {
          email: updateData.email,
          id: { not: id }
        }
      });

      if (emailExists) {
        return sendError(res, 'Contact with this email already exists', 400);
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    sendSuccess(res, 'Contact updated successfully', contact);
  } catch (error) {
    console.error('Update contact error:', error);
    sendError(res, 'Failed to update contact', 500);
  }
});

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if contact exists
    const contact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!contact) {
      return sendError(res, 'Contact not found', 404);
    }

    // Check if contact has any transactions
    const hasTransactions = await prisma.purchaseOrder.findFirst({
      where: { vendorId: id }
    }) || await prisma.salesOrder.findFirst({
      where: { customerId: id }
    });

    if (hasTransactions) {
      return sendError(res, 'Cannot delete contact with existing transactions', 400);
    }

    await prisma.contact.delete({
      where: { id }
    });

    sendSuccess(res, 'Contact deleted successfully');
  } catch (error) {
    console.error('Delete contact error:', error);
    sendError(res, 'Failed to delete contact', 500);
  }
});

// @desc    Upload contact profile image
// @route   POST /api/contacts/:id/upload-image
// @access  Private
router.post('/:id/upload-image', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if contact exists
    const contact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!contact) {
      return sendError(res, 'Contact not found', 404);
    }

    // In a real application, you would handle file upload here
    // For now, we'll just return a success message
    sendSuccess(res, 'Image upload endpoint ready - implement file upload logic');
  } catch (error) {
    console.error('Upload image error:', error);
    sendError(res, 'Failed to upload image', 500);
  }
});

// @desc    Get contact statistics
// @route   GET /api/contacts/stats
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalContacts, customers, vendors, both] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({ where: { type: 'CUSTOMER' } }),
      prisma.contact.count({ where: { type: 'VENDOR' } }),
      prisma.contact.count({ where: { type: 'BOTH' } })
    ]);

    sendSuccess(res, 'Contact statistics retrieved successfully', {
      totalContacts,
      customers,
      vendors,
      both
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    sendError(res, 'Failed to retrieve contact statistics', 500);
  }
});

export default router;
