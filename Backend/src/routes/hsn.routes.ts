import { Router, type Request, type Response } from 'express';
import { query, body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import axios from 'axios';
import prisma from '../lib/prisma.js';

const router = Router();

// @desc    Search HSN codes
// @route   GET /api/hsn/search
// @access  Private
router.get('/search', authenticate,validate([ query('inputText').notEmpty().withMessage('Input text is required'),
    query('selectedType').isIn(['byCode', 'byDesc']).withMessage('Selected type must be "byCode" or "byDesc"'),
    query('category').isIn(['null', 'P', 'S']).withMessage('Category must be "null", "P", or "S"')]), async (req: Request, res: Response) => {
  try {
    const { inputText, selectedType, category } = req.query;

    // Check cache first
    const cachedResults = await prisma.hsnCode.findMany({
      where: {
        OR: [
          { code: { contains: inputText as string, mode: 'insensitive' } },
          { description: { contains: inputText as string, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    if (cachedResults.length > 0) {
      return sendSuccess(res, 'HSN codes retrieved from cache', cachedResults);
    }

    // Call external HSN API
    const hsnApiUrl = process.env.HSN_API_BASE_URL || 'https://services.gst.gov.in/commonservices/hsn/search/qsearch';
    
    const response = await axios.get(hsnApiUrl, {
      params: {
        inputText,
        selectedType,
        category
      },
      timeout: 10000 // 10 seconds timeout
    });

    if (response.data && response.data.data) {
      const hsnCodes = response.data.data.map((item: any) => ({
        code: item.c,
        description: item.n,
        category: category === 'P' ? 'PRODUCT' : category === 'S' ? 'SERVICE' : 'GENERAL'
      }));

      // Cache the results
      try {
        await prisma.hsnCode.createMany({
          data: hsnCodes,
          skipDuplicates: true
        });
      } catch (cacheError) {
        console.warn('Failed to cache HSN codes:', cacheError);
      }

      sendSuccess(res, 'HSN codes retrieved successfully', hsnCodes);
    } else {
      sendError(res, 'No HSN codes found', 404);
    }
  } catch (error) {
    console.error('HSN search error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return sendError(res, 'HSN API request timeout', 408);
      }
      if (error.response && error.response.status === 404) {
        return sendError(res, 'HSN API not found', 404);
      }
      if (error.response && error.response.status >= 500) {
        return sendError(res, 'HSN API server error', 502);
      }
    }

    sendError(res, 'Failed to search HSN codes', 500);
  }
});

// @desc    Get HSN code by code
// @route   GET /api/hsn/code/:code
// @access  Private
router.get('/code/:code', authenticate, async (req, res) => {
  try {
    const { code } = req.params;

    const hsnCode = await prisma.hsnCode.findFirst({
      where: { code }
    });

    if (!hsnCode) {
      return sendError(res, 'HSN code not found', 404);
    }

    sendSuccess(res, 'HSN code retrieved successfully', hsnCode);
  } catch (error) {
    console.error('Get HSN code error:', error);
    sendError(res, 'Failed to retrieve HSN code', 500);
  }
});

// @desc    Get cached HSN codes
// @route   GET /api/hsn/cached
// @access  Private
router.get('/cached', 
  authenticate,validate([ query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('category').optional().isIn(['PRODUCT', 'SERVICE']).withMessage('Invalid category'),])
 
  
, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const category = req.query.category as string;

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    const skip = (page - 1) * limit;

    const [hsnCodes, total] = await Promise.all([
      prisma.hsnCode.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.hsnCode.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, 'Cached HSN codes retrieved successfully', hsnCodes, {
      page,
      limit,
      total,
      totalPages
    });
  } catch (error) {
    console.error('Get cached HSN codes error:', error);
    sendError(res, 'Failed to retrieve cached HSN codes', 500);
  }
});

// @desc    Clear HSN cache
// @route   DELETE /api/hsn/cache
// @access  Private
router.delete('/cache', authenticate, async (req, res) => {
  try {
    await prisma.hsnCode.deleteMany({});

    sendSuccess(res, 'HSN cache cleared successfully');
  } catch (error) {
    console.error('Clear HSN cache error:', error);
    sendError(res, 'Failed to clear HSN cache', 500);
  }
});

// @desc    Get HSN statistics
// @route   GET /api/hsn/stats
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalCodes, productCodes, serviceCodes] = await Promise.all([
      prisma.hsnCode.count(),
      prisma.hsnCode.count({ where: { category: 'PRODUCT' } }),
      prisma.hsnCode.count({ where: { category: 'SERVICE' } })
    ]);

    sendSuccess(res, 'HSN statistics retrieved successfully', {
      totalCodes,
      productCodes,
      serviceCodes
    });
  } catch (error) {
    console.error('Get HSN stats error:', error);
    sendError(res, 'Failed to retrieve HSN statistics', 500);
  }
});

// @desc    Validate HSN code
// @route   POST /api/hsn/validate
// @access  Private
router.post('/validate', 
  authenticate,
  validate([
    body('code').notEmpty().withMessage('HSN code is required')
  ]),
  async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    // Check if code exists in cache
    const cachedCode = await prisma.hsnCode.findFirst({
      where: { code }
    });

    if (cachedCode) {
      return sendSuccess(res, 'HSN code is valid', {
        code: cachedCode.code,
        description: cachedCode.description,
        category: cachedCode.category,
        isValid: true,
        source: 'cache'
      });
    }

    // If not in cache, try to fetch from API
    try {
      const hsnApiUrl = process.env.HSN_API_BASE_URL || 'https://services.gst.gov.in/commonservices/hsn/search/qsearch';
      
      const response = await axios.get(hsnApiUrl, {
        params: {
          inputText: code,
          selectedType: 'byCode',
          category: 'null'
        },
        timeout: 5000
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        const hsnData = response.data.data[0];
        
        // Cache the result
        await prisma.hsnCode.create({
          data: {
            code: hsnData.c,
            description: hsnData.n,
            category: 'GENERAL'
          }
        });

        return sendSuccess(res, 'HSN code is valid', {
          code: hsnData.c,
          description: hsnData.n,
          category: 'GENERAL',
          isValid: true,
          source: 'api'
        });
      } else {
        return sendSuccess(res, 'HSN code is invalid', {
          code,
          isValid: false,
          source: 'api'
        });
      }
    } catch (apiError) {
      return sendSuccess(res, 'HSN code validation failed - API unavailable', {
        code,
        isValid: false,
        source: 'api_error'
      });
    }
  } catch (error) {
    console.error('Validate HSN code error:', error);
    sendError(res, 'Failed to validate HSN code', 500);
  }
});

export default router;
