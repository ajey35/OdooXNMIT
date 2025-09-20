import { Router, type Request, type Response } from 'express';
import { query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import prisma from '../lib/prisma.js';

const router = Router();

// @desc    Get balance sheet
// @route   GET /api/reports/balance-sheet
// @access  Private
router.get('/balance-sheet', authenticate, validate([
  query('asOfDate').optional().isISO8601().withMessage('As of date must be a valid date'),
]), async (req: Request, res: Response) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : new Date();

    // Get all accounts with their balances
    const accounts = await prisma.chartOfAccount.findMany({
      include: {
        ledgerEntries: {
          where: {
            transactionDate: {
              lte: asOfDate
            }
          }
        }
      }
    });

    // Calculate balances for each account
    const accountBalances = accounts.map(account => {
      let balance = 0;
      
      account.ledgerEntries.forEach(entry => {
        if (entry.entryType === 'DEBIT') {
          balance += entry.amount.toNumber();
        } else {
          balance -= entry.amount.toNumber();
        }
      });

      return {
        id: account.id,
        name: account.name,
        code: account.code,
        type: account.type,
        balance: Math.abs(balance),
        isDebit: balance >= 0
      };
    });

    // Group by account type
    const assets = accountBalances.filter(acc => acc.type === 'ASSET' && acc.balance > 0);
    const liabilities = accountBalances.filter(acc => acc.type === 'LIABILITY' && acc.balance > 0);
    const equity = accountBalances.filter(acc => acc.type === 'EQUITY' && acc.balance > 0);

    const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);

    const balanceSheet = {
      asOfDate,
      assets: {
        items: assets,
        total: totalAssets
      },
      liabilities: {
        items: liabilities,
        total: totalLiabilities
      },
      equity: {
        items: equity,
        total: totalEquity
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    };

    sendSuccess(res, 'Balance sheet retrieved successfully', balanceSheet);
  } catch (error) {
    console.error('Get balance sheet error:', error);
    sendError(res, 'Failed to retrieve balance sheet', 500);
  }
});

// @desc    Get profit and loss statement
// @route   GET /api/reports/profit-loss
// @access  Private
router.get('/profit-loss', 
  authenticate, validate([ query('startDate').isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').isISO8601().withMessage('End date must be a valid date'),])

, async (req: Request, res: Response) => {
  try {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    // Get income accounts
    const incomeAccounts = await prisma.chartOfAccount.findMany({
      where: { type: 'INCOME' },
      include: {
        ledgerEntries: {
          where: {
            transactionDate: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });

    // Get expense accounts
    const expenseAccounts = await prisma.chartOfAccount.findMany({
      where: { type: 'EXPENSE' },
      include: {
        ledgerEntries: {
          where: {
            transactionDate: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });

    // Calculate income
    const incomeItems = incomeAccounts.map(account => {
      let balance = 0;
      
      account.ledgerEntries.forEach(entry => {
        if (entry.entryType === 'CREDIT') {
          balance += entry.amount.toNumber();
        } else {
          balance -= entry.amount.toNumber();
        }
      });

      return {
        id: account.id,
        name: account.name,
        code: account.code,
        amount: Math.abs(balance)
      };
    }).filter(item => item.amount > 0);

    // Calculate expenses
    const expenseItems = expenseAccounts.map(account => {
      let balance = 0;
      
      account.ledgerEntries.forEach(entry => {
        if (entry.entryType === 'DEBIT') {
          balance += entry.amount.toNumber();
        } else {
          balance -= entry.amount.toNumber();
        }
      });

      return {
        id: account.id,
        name: account.name,
        code: account.code,
        amount: Math.abs(balance)
      };
    }).filter(item => item.amount > 0);

    const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    const profitLoss = {
      period: {
        startDate,
        endDate
      },
      income: {
        items: incomeItems,
        total: totalIncome
      },
      expenses: {
        items: expenseItems,
        total: totalExpenses
      },
      netProfit,
      isProfit: netProfit >= 0
    };

    sendSuccess(res, 'Profit and loss statement retrieved successfully', profitLoss);
  } catch (error) {
    console.error('Get profit and loss error:', error);
    sendError(res, 'Failed to retrieve profit and loss statement', 500);
  }
});

// @desc    Get stock statement
// @route   GET /api/reports/stock-statement
// @access  Private
router.get('/stock-statement',
  authenticate,validate([ query('asOfDate').optional().isISO8601().withMessage('As of date must be a valid date'),
    query('productId').optional().isString().withMessage('Product ID must be a string'),])
 
  
, async (req: Request, res: Response) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : new Date();
    const productId = req.query.productId as string;

    const where: any = {
      movementDate: {
        lte: asOfDate
      }
    };

    if (productId) {
      where.productId = productId;
    }

    // Get all stock movements up to the specified date
    const stockMovements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            type: true,
            purchasePrice: true
          }
        }
      },
      orderBy: [
        { productId: 'asc' },
        { movementDate: 'asc' }
      ]
    });

    // Group by product and calculate current stock
    const productStock: Record<string, any> = {};

    stockMovements.forEach(movement => {
      const productId = movement.productId;
      
      if (!productStock[productId]) {
        productStock[productId] = {
          product: movement.product,
          openingStock: 0,
          purchases: 0,
          sales: 0,
          adjustments: 0,
          closingStock: 0,
          movements: []
        };
      }

      const quantity = movement.quantity.toNumber();
      
      if (movement.movementType === 'IN') {
        productStock[productId].purchases += quantity;
      } else if (movement.movementType === 'OUT') {
        productStock[productId].sales += quantity;
      } else if (movement.movementType === 'ADJUSTMENT') {
        productStock[productId].adjustments += quantity;
      }

      productStock[productId].movements.push({
        id: movement.id,
        movementType: movement.movementType,
        quantity: quantity,
        movementDate: movement.movementDate,
        referenceType: movement.referenceType,
        referenceId: movement.referenceId,
        description: movement.description
      });
    });

    // Calculate closing stock for each product
    const stockItems = Object.values(productStock).map((item: any) => {
      item.closingStock = item.purchases - item.sales + item.adjustments;
      item.stockValue = item.closingStock * item.product.purchasePrice.toNumber();
      return item;
    });

    const totalStockValue = stockItems.reduce((sum, item) => sum + item.stockValue, 0);

    const stockStatement = {
      asOfDate,
      items: stockItems,
      summary: {
        totalProducts: stockItems.length,
        totalStockValue,
        totalQuantity: stockItems.reduce((sum, item) => sum + item.closingStock, 0)
      }
    };

    sendSuccess(res, 'Stock statement retrieved successfully', stockStatement);
  } catch (error) {
    console.error('Get stock statement error:', error);
    sendError(res, 'Failed to retrieve stock statement', 500);
  }
});

// @desc    Get partner ledger
// @route   GET /api/reports/partner-ledger
// @access  Private
router.get('/partner-ledger', 
  authenticate,validate([query('contactId').isString().withMessage('Contact ID is required'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    ])
  
, async (req: Request, res: Response) => {
  try {
    const contactId = req.query.contactId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!contact) {
      return sendError(res, 'Contact not found', 404);
    }

    // Get all transactions for the contact
    const where: any = { contactId };

    if (startDate && endDate) {
      where.transactionDate = {
        gte: startDate,
        lte: endDate
      };
    }

    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true
          }
        }
      },
      orderBy: { transactionDate: 'asc' }
    });

    // Calculate running balance
    let runningBalance = 0;
    const transactions = ledgerEntries.map(entry => {
      const amount = entry.amount.toNumber();
      
      if (entry.entryType === 'DEBIT') {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }

      return {
        id: entry.id,
        date: entry.transactionDate,
        account: entry.account,
        description: entry.description,
        referenceType: entry.referenceType,
        referenceId: entry.referenceId,
        debit: entry.entryType === 'DEBIT' ? amount : 0,
        credit: entry.entryType === 'CREDIT' ? amount : 0,
        balance: runningBalance
      };
    });

    const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
    const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
    const finalBalance = runningBalance;

    const partnerLedger = {
      contact: {
        id: contact.id,
        name: contact.name,
        type: contact.type,
        email: contact.email,
        mobile: contact.mobile
      },
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      transactions,
      summary: {
        totalDebit,
        totalCredit,
        finalBalance,
        isDebit: finalBalance >= 0
      }
    };

    sendSuccess(res, 'Partner ledger retrieved successfully', partnerLedger);
  } catch (error) {
    console.error('Get partner ledger error:', error);
    sendError(res, 'Failed to retrieve partner ledger', 500);
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // Get sales data
    const [monthlySales, yearlySales, totalSales] = await Promise.all([
      prisma.customerInvoice.aggregate({
        where: {
          invoiceDate: {
            gte: startOfMonth
          }
        },
        _sum: { total: true },
        _count: true
      }),
      prisma.customerInvoice.aggregate({
        where: {
          invoiceDate: {
            gte: startOfYear
          }
        },
        _sum: { total: true },
        _count: true
      }),
      prisma.customerInvoice.aggregate({
        _sum: { total: true },
        _count: true
      })
    ]);

    // Get purchase data
    const [monthlyPurchases, yearlyPurchases, totalPurchases] = await Promise.all([
      prisma.vendorBill.aggregate({
        where: {
          billDate: {
            gte: startOfMonth
          }
        },
        _sum: { total: true },
        _count: true
      }),
      prisma.vendorBill.aggregate({
        where: {
          billDate: {
            gte: startOfYear
          }
        },
        _sum: { total: true },
        _count: true
      }),
      prisma.vendorBill.aggregate({
        _sum: { total: true },
        _count: true
      })
    ]);

    // Get payment data
    const [monthlyPayments, totalPayments] = await Promise.all([
      prisma.invoicePayment.aggregate({
        where: {
          paymentDate: {
            gte: startOfMonth
          }
        },
        _sum: { amount: true }
      }),
      prisma.invoicePayment.aggregate({
        _sum: { amount: true }
      })
    ]);

    // Get pending amounts
    const [pendingReceivables, pendingPayables] = await Promise.all([
      prisma.customerInvoice.aggregate({
        where: {
          paymentStatus: {
            in: ['UNPAID', 'PARTIAL']
          }
        },
        _sum: { 
          total: true,
          paidAmount: true 
        }
      }),
      prisma.vendorBill.aggregate({
        where: {
          paymentStatus: {
            in: ['UNPAID', 'PARTIAL']
          }
        },
        _sum: { 
          total: true,
          paidAmount: true 
        }
      })
    ]);

    const dashboard = {
      sales: {
        monthly: {
          amount: monthlySales._sum.total || 0,
          count: monthlySales._count || 0
        },
        yearly: {
          amount: yearlySales._sum.total || 0,
          count: yearlySales._count || 0
        },
        total: {
          amount: totalSales._sum.total || 0,
          count: totalSales._count || 0
        }
      },
      purchases: {
        monthly: {
          amount: monthlyPurchases._sum.total || 0,
          count: monthlyPurchases._count || 0
        },
        yearly: {
          amount: yearlyPurchases._sum.total || 0,
          count: yearlyPurchases._count || 0
        },
        total: {
          amount: totalPurchases._sum.total || 0,
          count: totalPurchases._count || 0
        }
      },
      payments: {
        monthly: monthlyPayments._sum.amount || 0,
        total: totalPayments._sum.amount || 0
      },
      pending: {
        receivables: (pendingReceivables._sum.total ? pendingReceivables._sum.total.toNumber() : 0) - (pendingReceivables._sum.paidAmount ? pendingReceivables._sum.paidAmount.toNumber() : 0),
        payables: (pendingPayables._sum.total ? pendingPayables._sum.total.toNumber() : 0) - (pendingPayables._sum.paidAmount ? pendingPayables._sum.paidAmount.toNumber() : 0)
      },
      profit: {
        monthly: (monthlySales._sum.total ? monthlySales._sum.total.toNumber() : 0) - (monthlyPurchases._sum.total ? monthlyPurchases._sum.total.toNumber() : 0),
        yearly: (yearlySales._sum.total ? yearlySales._sum.total.toNumber() : 0) - (yearlyPurchases._sum.total ? yearlyPurchases._sum.total.toNumber() : 0),
        total: (totalSales._sum.total ? totalSales._sum.total.toNumber() : 0) - (totalPurchases._sum.total ? totalPurchases._sum.total.toNumber() : 0)
      }
    };

    sendSuccess(res, 'Dashboard statistics retrieved successfully', dashboard);
  } catch (error) {
    console.error('Get dashboard error:', error);
    sendError(res, 'Failed to retrieve dashboard statistics', 500);
  }
});

export default router;
