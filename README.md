# OdooXNMIT - Modern Accounting & ERP System

A comprehensive, full-stack accounting and ERP system built with modern technologies. This project provides a complete solution for managing sales, purchases, inventory, contacts, and financial reporting.

## 🚀 Features

### Core Modules
- **Sales Management**: Sales orders, customer invoices, payments
- **Purchase Management**: Purchase orders, vendor bills, payments
- **Inventory Management**: Product catalog with HSN codes, stock tracking
- **Contact Management**: Customer and vendor database
- **Financial Reporting**: Balance sheet, profit & loss, partner ledger, stock statements
- **User Management**: Role-based access control with authentication

### Key Features
- *Real-time Dashboard** with dynamic charts and statistics
- **Secure Authentication** with JWT tokens and OTP verification
-  **Responsive Design** optimized for all devices
-  **Modern UI/UX** built with Tailwind CSS and Radix UI
-  **Advanced Reporting** with export and print functionality
-  **Auto-generated Numbers** for orders and invoices
-  **Tax Management** with GST integration
-  **Data Tables** with filtering, searching, and sorting

## 🏗️ Architecture

### Backend (`/Backend`)
- **Runtime**: Bun (TypeScript-first JavaScript runtime)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Joi and Express Validator

### Frontend (`/frontend2`)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: React Context API
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation

## 📁 Project Structure

```
OdooXNMIT/
├── Backend/                          # Backend API Server
│   ├── src/
│   │   ├── routes/                   # API Route handlers
│   │   │   ├── auth.routes.ts        # Authentication endpoints
│   │   │   ├── salesOrder.routes.ts  # Sales order management
│   │   │   ├── purchaseOrder.routes.ts # Purchase order management
│   │   │   ├── contact.routes.ts     # Contact management
│   │   │   ├── product.routes.ts     # Product catalog
│   │   │   ├── customerInvoice.routes.ts # Customer invoices
│   │   │   ├── vendorBill.routes.ts  # Vendor bills
│   │   │   ├── payment.routes.ts     # Payment processing
│   │   │   ├── report.routes.ts      # Financial reports
│   │   │   ├── tax.routes.ts         # Tax management
│   │   │   ├── hsn.routes.ts         # HSN code management
│   │   │   └── chartOfAccount.routes.ts # Chart of accounts
│   │   ├── middleware/               # Express middleware
│   │   ├── utils/                    # Utility functions
│   │   ├── types/                    # TypeScript type definitions
│   │   ├── scripts/                  # Database seeding scripts
│   │   └── tests/                    # Backend tests
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   └── migrations/              # Database migrations
│   ├── docs/
│   │   └── swagger.json             # API documentation
│   └── package.json
├── frontend2/                        # Frontend React Application
│   ├── app/                         # Next.js App Router pages
│   │   ├── auth/                    # Authentication pages
│   │   ├── dashboard/               # Dashboard page
│   │   ├── sales/                   # Sales module pages
│   │   ├── purchase/                # Purchase module pages
│   │   ├── master/                  # Master data pages
│   │   ├── reports/                 # Report pages
│   │   ├── settings/                # Settings pages
│   │   └── api/                     # API route handlers
│   ├── components/                  # React components
│   │   ├── forms/                   # Form components
│   │   ├── ui/                      # UI component library
│   │   ├── layout/                  # Layout components
│   │   └── auth/                    # Authentication components
│   ├── lib/                         # Utility libraries
│   │   ├── api.ts                   # API client
│   │   ├── auth.tsx                 # Authentication context
│   │   └── utils.ts                 # Helper functions
│   ├── hooks/                       # Custom React hooks
│   └── styles/                      # Global styles
└── README.md
```

## 🛠️ Technology Stack

### Backend Technologies
- **Bun** - Fast JavaScript runtime and package manager
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Modern database ORM
- **PostgreSQL** - Robust relational database
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Joi** - Schema validation
- **Swagger** - API documentation

### Frontend Technologies
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Recharts** - Chart library
- **Lucide React** - Icon library

## 🚀 Getting Started

### Prerequisites
- **Bun** (latest version) - [Install Bun](https://bun.sh/docs/installation)
- **Node.js** (18+ recommended)
- **PostgreSQL** (12+ recommended)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OdooXNMIT
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   bun install
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Set up the database
   bun run db:generate
   bun run db:push
   
   # Seed the database (optional)
   bun run db:seed
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend2
   bun install
   
   # Set up environment variables
   cp .env.local.example .env.local
   # Edit .env.local with your API URL
   ```

### Environment Variables

#### Backend (`.env`)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/odoo_xnmit"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRE="7d"
NODE_ENV="development"
PORT=5000
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

#### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_APP_NAME="OdooXNMIT"
```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Backend**
   ```bash
   cd Backend
   bun run dev
   ```
   Backend will be available at `http://localhost:5000`

2. **Start the Frontend**
   ```bash
   cd frontend2
   bun run dev
   ```
   Frontend will be available at `http://localhost:3000`

### Production Mode

1. **Build Backend**
   ```bash
   cd Backend
   bun run build
   bun run start
   ```

2. **Build Frontend**
   ```bash
   cd frontend2
   bun run build
   bun run start
   ```

## 📚 API Documentation

The API documentation is available via Swagger UI when running the backend:
- **Development**: `http://localhost:5000/api-docs`
- **Swagger JSON**: `http://localhost:5000/api/docs/swagger.json`

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation
- `POST /api/auth/verify-otp` - OTP verification

#### Sales Management
- `GET /api/sales-orders` - List sales orders
- `POST /api/sales-orders` - Create sales order
- `PUT /api/sales-orders/:id` - Update sales order
- `DELETE /api/sales-orders/:id` - Delete sales order

#### Purchase Management
- `GET /api/purchase-orders` - List purchase orders
- `POST /api/purchase-orders` - Create purchase order
- `PUT /api/purchase-orders/:id` - Update purchase order
- `DELETE /api/purchase-orders/:id` - Delete purchase order

#### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/balance-sheet` - Balance sheet
- `GET /api/reports/profit-loss` - Profit & loss statement
- `GET /api/reports/partner-ledger` - Partner ledger
- `GET /api/reports/stock-statement` - Stock statement

## 🗄️ Database Schema

### Key Models
- **User** - System users with role-based access
- **Contact** - Customers and vendors
- **Product** - Product catalog with HSN codes
- **SalesOrder** - Sales order management
- **PurchaseOrder** - Purchase order management
- **CustomerInvoice** - Customer invoicing
- **VendorBill** - Vendor billing
- **Payment** - Payment processing
- **ChartOfAccount** - Accounting chart of accounts

### Database Features
- **Auto-generated IDs** using CUID
- **Timestamps** for audit trails
- **Soft deletes** for data integrity
- **Relationships** with proper foreign keys
- **Enums** for status and type management

## 🧪 Testing

### Backend Testing
```bash
cd Backend
bun run test              # Run all tests
bun run test:watch        # Watch mode
bun run test:coverage     # Coverage report
```

### Frontend Testing
```bash
cd frontend2
bun run test              # Run tests
bun run test:watch        # Watch mode
```

## 📦 Available Scripts

### Backend Scripts
```bash
bun run dev              # Development server
bun run build            # Build for production
bun run start            # Start production server
bun run db:generate      # Generate Prisma client
bun run db:push          # Push schema to database
bun run db:migrate       # Run migrations
bun run db:studio        # Open Prisma Studio
bun run db:seed          # Seed database
bun run lint             # Lint code
bun run docs:generate    # Generate API docs
```

### Frontend Scripts
```bash
bun run dev              # Development server
bun run build            # Build for production
bun run start            # Start production server
bun run lint             # Lint code
```

## 🎨 UI Components

The project uses a comprehensive UI component library built on Radix UI primitives:

### Form Components
- `ProductForm` - Product creation/editing
- `ContactForm` - Contact management
- `SalesOrderForm` - Sales order creation
- `PurchaseOrderForm` - Purchase order creation
- `CustomerInvoiceForm` - Invoice creation
- `VendorBillForm` - Bill creation

### Layout Components
- `DashboardLayout` - Main dashboard layout
- `Header` - Application header
- `Sidebar` - Navigation sidebar
- `TopMenu` - Top navigation menu

### UI Components
- Data tables with filtering and sorting
- Modal dialogs and forms
- Charts and graphs
- Toast notifications
- Loading states and skeletons

## 🔐 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcryptjs
- **OTP Verification** for password reset
- **Role-based Access Control** (Admin, User, Contact)
- **Input Validation** on both frontend and backend
- **Rate Limiting** for API endpoints
- **CORS Protection** configured
- **Helmet** for security headers

## 📊 Reporting Features

### Financial Reports
- **Balance Sheet** - Assets, liabilities, and equity
- **Profit & Loss** - Income and expense statement
- **Partner Ledger** - Customer/vendor transaction history
- **Stock Statement** - Inventory levels and valuation

### Dashboard Analytics
- **Monthly Sales** - Sales trends and statistics
- **Purchase Analytics** - Purchase patterns and costs
- **Profit Tracking** - Profit margins and trends
- **Payment Status** - Receivables and payables

### Export Features
- **PDF Export** for all reports
- **CSV Export** for data analysis
- **Print Functionality** for physical copies

## 🚀 Deployment

### Backend Deployment
1. Build the application: `bun run build`
2. Set production environment variables
3. Run database migrations: `bun run db:migrate`
4. Start the server: `bun run start`

### Frontend Deployment
1. Build the application: `bun run build`
2. Set production environment variables
3. Deploy to your preferred platform (Vercel, Netlify, etc.)

### Docker Deployment (Optional)
```dockerfile
# Backend Dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build
EXPOSE 5000
CMD ["bun", "run", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Shiv Accounts Cloud** - *Initial work*

## 🙏 Acknowledgments

- Built with modern web technologies
- UI components from Radix UI
- Icons from Lucide React
- Charts powered by Recharts
- Database managed with Prisma ORM

## 📞 Support

For support, email support@shivaccountscloud.com or create an issue in the repository.

---

**Built with ❤️ using modern web technologies**
