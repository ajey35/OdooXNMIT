# Shiv Accounts Cloud - Backend API

A comprehensive accounting system backend built with Node.js, Express, TypeScript, and Prisma ORM.

## 🚀 Features

- **User Management**: Role-based authentication (Admin, Invoicing User, Contact)
- **Master Data Management**: Contacts, Products, Taxes, Chart of Accounts
- **Transaction Management**: Purchase Orders, Sales Orders, Vendor Bills, Customer Invoices
- **Payment Processing**: Bill Payments, Invoice Payments
- **Financial Reporting**: Balance Sheet, Profit & Loss, Stock Statement, Partner Ledger
- **HSN Code Integration**: External API integration for product classification
- **Comprehensive API Documentation**: OpenAPI/Swagger documentation

## 🛠️ Tech Stack

- **Runtime**: Node.js with Bun
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Express Validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Bun Test

## 📋 Prerequisites

- Node.js (v18 or higher)
- Bun (latest version)
- PostgreSQL (v12 or higher)

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
cd Backend
bun install
```

### 2. Environment Setup

Copy the environment file and configure your settings:

```bash
cp env.example .env
```

Update the `.env` file with your database credentials and other settings:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/shiv_accounts?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
JWT_REFRESH_EXPIRES_IN="30d"

# Server Configuration
PORT=3001
NODE_ENV="development"
```

### 3. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Seed the database with sample data
bun run db:seed
```

### 4. Start Development Server

```bash
bun run dev
```

The server will start on `http://localhost:3001`

## 📚 API Documentation

Once the server is running, you can access the interactive API documentation at:
- **Swagger UI**: `http://localhost:3001/api-docs`
- **Health Check**: `http://localhost:3001/health`

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

## 📁 Project Structure

```
Backend/
├── src/
│   ├── routes/           # API route handlers
│   ├── middleware/       # Custom middleware
│   ├── lib/             # Database connection
│   ├── utils/           # Utility functions
│   ├── scripts/         # Database scripts
│   └── tests/           # Test files
├── prisma/
│   └── schema.prisma    # Database schema
├── docs/
│   └── swagger.json     # API documentation
└── package.json
```

## 🔐 Authentication

The API uses JWT-based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Default Admin Credentials (after seeding)
- **Email**: admin@shivaccounts.com
- **Password**: admin123

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Master Data
- `GET/POST /api/contacts` - Manage contacts
- `GET/POST /api/products` - Manage products
- `GET/POST /api/taxes` - Manage taxes
- `GET/POST /api/chart-of-accounts` - Manage chart of accounts

### Transactions
- `GET/POST /api/purchase-orders` - Manage purchase orders
- `GET/POST /api/sales-orders` - Manage sales orders
- `GET/POST /api/vendor-bills` - Manage vendor bills
- `GET/POST /api/customer-invoices` - Manage customer invoices

### Payments
- `GET/POST /api/payments/bill-payments` - Manage bill payments
- `GET/POST /api/payments/invoice-payments` - Manage invoice payments

### Reports
- `GET /api/reports/balance-sheet` - Get balance sheet
- `GET /api/reports/profit-loss` - Get P&L statement
- `GET /api/reports/stock-statement` - Get stock statement
- `GET /api/reports/partner-ledger` - Get partner ledger
- `GET /api/reports/dashboard` - Get dashboard statistics

### HSN Integration
- `GET /api/hsn/search` - Search HSN codes
- `GET /api/hsn/cached` - Get cached HSN codes
- `POST /api/hsn/validate` - Validate HSN code

## 🗄️ Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users**: User management with roles
- **Contacts**: Customers and vendors
- **Products**: Goods and services
- **Taxes**: Tax configurations
- **Chart of Accounts**: Financial account structure
- **Transactions**: Purchase orders, sales orders, bills, invoices
- **Payments**: Bill and invoice payments
- **Ledger Entries**: Double-entry bookkeeping
- **Stock Movements**: Inventory tracking
- **HSN Codes**: Product classification cache

## 🔧 Development

### Code Quality
```bash
# Lint code
bun run lint

# Fix linting issues
bun run lint:fix
```

### Database Management
```bash
# Open Prisma Studio
bun run db:studio

# Reset database
bun run db:push --force-reset
```

## 🚀 Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a production PostgreSQL database
3. Set strong JWT secrets
4. Configure proper CORS origins
5. Use a reverse proxy (nginx) for SSL termination
6. Set up monitoring and logging

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.