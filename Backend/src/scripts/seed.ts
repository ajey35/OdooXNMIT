import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shivaccounts.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@shivaccounts.com',
      loginId: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample contacts
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { email: 'customer1@example.com' },
      update: {},
      create: {
        name: 'Nimesh Pathak',
        type: 'CUSTOMER',
        email: 'customer1@example.com',
        mobile: '9876543210',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        address: '123 Main Street',
        createdById: admin.id
      }
    }),
    prisma.contact.upsert({
      where: { email: 'vendor1@example.com' },
      update: {},
      create: {
        name: 'Azure Furniture',
        type: 'VENDOR',
        email: 'vendor1@example.com',
        mobile: '9876543211',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        address: '456 Business Avenue',
        createdById: admin.id
      }
    }),
    prisma.contact.upsert({
      where: { email: 'both1@example.com' },
      update: {},
      create: {
        name: 'Shiv Furniture',
        type: 'BOTH',
        email: 'both1@example.com',
        mobile: '9876543212',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        address: '789 Trade Center',
        createdById: admin.id
      }
    })
  ]);

  console.log('✅ Sample contacts created:', contacts.length);

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { name: 'Office Chair' },
      update: {},
      create: {
        name: 'Office Chair',
        type: 'GOODS',
        salesPrice: 5000,
        purchasePrice: 3500,
        salesTaxPercent: 18,
        purchaseTaxPercent: 18,
        hsnCode: '9401',
        category: 'Furniture'
      }
    }),
    prisma.product.upsert({
      where: { name: 'Wooden Table' },
      update: {},
      create: {
        name: 'Wooden Table',
        type: 'GOODS',
        salesPrice: 15000,
        purchasePrice: 10000,
        salesTaxPercent: 18,
        purchaseTaxPercent: 18,
        hsnCode: '9403',
        category: 'Furniture'
      }
    }),
    prisma.product.upsert({
      where: { name: 'Sofa Set' },
      update: {},
      create: {
        name: 'Sofa Set',
        type: 'GOODS',
        salesPrice: 25000,
        purchasePrice: 18000,
        salesTaxPercent: 18,
        purchaseTaxPercent: 18,
        hsnCode: '9401',
        category: 'Furniture'
      }
    }),
    prisma.product.upsert({
      where: { name: 'Dining Table' },
      update: {},
      create: {
        name: 'Dining Table',
        type: 'GOODS',
        salesPrice: 20000,
        purchasePrice: 15000,
        salesTaxPercent: 18,
        purchaseTaxPercent: 18,
        hsnCode: '9403',
        category: 'Furniture'
      }
    }),
    prisma.product.upsert({
      where: { name: 'Consultation Service' },
      update: {},
      create: {
        name: 'Consultation Service',
        type: 'SERVICE',
        salesPrice: 1000,
        purchasePrice: 0,
        salesTaxPercent: 18,
        purchaseTaxPercent: 0,
        hsnCode: '9983',
        category: 'Services'
      }
    })
  ]);

  console.log('✅ Sample products created:', products.length);

  // Create sample taxes
  const taxes = await Promise.all([
    prisma.tax.upsert({
      where: { name: 'GST 5%' },
      update: {},
      create: {
        name: 'GST 5%',
        computationMethod: 'PERCENTAGE',
        rate: 5,
        applicableOnSales: true,
        applicableOnPurchase: true
      }
    }),
    prisma.tax.upsert({
      where: { name: 'GST 12%' },
      update: {},
      create: {
        name: 'GST 12%',
        computationMethod: 'PERCENTAGE',
        rate: 12,
        applicableOnSales: true,
        applicableOnPurchase: true
      }
    }),
    prisma.tax.upsert({
      where: { name: 'GST 18%' },
      update: {},
      create: {
        name: 'GST 18%',
        computationMethod: 'PERCENTAGE',
        rate: 18,
        applicableOnSales: true,
        applicableOnPurchase: true
      }
    }),
    prisma.tax.upsert({
      where: { name: 'GST 28%' },
      update: {},
      create: {
        name: 'GST 28%',
        computationMethod: 'PERCENTAGE',
        rate: 28,
        applicableOnSales: true,
        applicableOnPurchase: true
      }
    })
  ]);

  console.log('✅ Sample taxes created:', taxes.length);

  // Create chart of accounts
  const chartOfAccounts = await Promise.all([
    // Assets
    prisma.chartOfAccount.upsert({
      where: { name: 'Cash' },
      update: {},
      create: {
        name: 'Cash',
        type: 'ASSET',
        code: '1001'
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { name: 'Bank Account' },
      update: {},
      create: {
        name: 'Bank Account',
        type: 'ASSET',
        code: '1002'
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { name: 'Accounts Receivable' },
      update: {},
      create: {
        name: 'Accounts Receivable',
        type: 'ASSET',
        code: '1003'
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { name: 'Inventory' },
      update: {},
      create: {
        name: 'Inventory',
        type: 'ASSET',
        code: '1004'
      }
    }),

    // Liabilities
    prisma.chartOfAccount.upsert({
      where: { name: 'Accounts Payable' },
      update: {},
      create: {
        name: 'Accounts Payable',
        type: 'LIABILITY',
        code: '2001'
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { name: 'GST Payable' },
      update: {},
      create: {
        name: 'GST Payable',
        type: 'LIABILITY',
        code: '2002'
      }
    }),

    // Income
    prisma.chartOfAccount.upsert({
      where: { name: 'Sales Income' },
      update: {},
      create: {
        name: 'Sales Income',
        type: 'INCOME',
        code: '4001'
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { name: 'Service Income' },
      update: {},
      create: {
        name: 'Service Income',
        type: 'INCOME',
        code: '4002'
      }
    }),

    // Expenses
    prisma.chartOfAccount.upsert({
      where: { name: 'Purchases' },
      update: {},
      create: {
        name: 'Purchases',
        type: 'EXPENSE',
        code: '5001'
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { name: 'Office Expenses' },
      update: {},
      create: {
        name: 'Office Expenses',
        type: 'EXPENSE',
        code: '5002'
      }
    }),

    // Equity
    prisma.chartOfAccount.upsert({
      where: { name: 'Owner Equity' },
      update: {},
      create: {
        name: 'Owner Equity',
        type: 'EQUITY',
        code: '3001'
      }
    })
  ]);

  console.log('✅ Chart of accounts created:', chartOfAccounts.length);

  // Create sample HSN codes
  const hsnCodes = await Promise.all([
    prisma.hsnCode.upsert({
      where: { code: '9401' },
      update: {},
      create: {
        code: '9401',
        description: 'Seats, whether or not convertible into beds, and parts thereof',
        category: 'PRODUCT'
      }
    }),
    prisma.hsnCode.upsert({
      where: { code: '9403' },
      update: {},
      create: {
        code: '9403',
        description: 'Other furniture and parts thereof',
        category: 'PRODUCT'
      }
    }),
    prisma.hsnCode.upsert({
      where: { code: '9983' },
      update: {},
      create: {
        code: '9983',
        description: 'Other professional, technical and business services',
        category: 'SERVICE'
      }
    })
  ]);

  console.log('✅ Sample HSN codes created:', hsnCodes.length);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('Email: admin@shivaccounts.com');
  console.log('Password: admin123');
  console.log('\n🚀 You can now start the server with: bun run dev');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
