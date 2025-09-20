-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'INVOICING_USER', 'CONTACT');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."ContactType" AS ENUM ('CUSTOMER', 'VENDOR', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('GOODS', 'SERVICE');

-- CreateEnum
CREATE TYPE "public"."TaxComputationMethod" AS ENUM ('PERCENTAGE', 'FIXED_VALUE');

-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EXPENSE', 'INCOME', 'EQUITY');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PAID', 'UNPAID', 'PARTIAL');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'BANK', 'CHEQUE', 'ONLINE');

-- CreateEnum
CREATE TYPE "public"."LedgerEntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "public"."StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "login_id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'INVOICING_USER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contacts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ContactType" NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "address" TEXT,
    "profile_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ProductType" NOT NULL,
    "sales_price" DECIMAL(10,2) NOT NULL,
    "purchase_price" DECIMAL(10,2) NOT NULL,
    "sales_tax_percent" DECIMAL(5,2),
    "purchase_tax_percent" DECIMAL(5,2),
    "hsn_code" TEXT,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."taxes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "computation_method" "public"."TaxComputationMethod" NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "applicable_on_sales" BOOLEAN NOT NULL DEFAULT true,
    "applicable_on_purchase" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chart_of_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AccountType" NOT NULL,
    "code" TEXT,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_orders" (
    "id" TEXT NOT NULL,
    "po_number" TEXT NOT NULL,
    "po_date" TIMESTAMP(3) NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "tax_id" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_orders" (
    "id" TEXT NOT NULL,
    "so_number" TEXT NOT NULL,
    "so_date" TIMESTAMP(3) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "so_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_order_items" (
    "id" TEXT NOT NULL,
    "sales_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "tax_id" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vendor_bills" (
    "id" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "bill_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "purchase_order_id" TEXT,
    "bill_reference" TEXT,
    "payment_status" "public"."PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vendor_bill_items" (
    "id" TEXT NOT NULL,
    "vendor_bill_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "tax_id" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "sales_order_id" TEXT,
    "payment_status" "public"."PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_invoice_items" (
    "id" TEXT NOT NULL,
    "customer_invoice_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "tax_id" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bill_payments" (
    "id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "payment_method" "public"."PaymentMethod" NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_bill_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoice_payments" (
    "id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "payment_method" "public"."PaymentMethod" NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ledger_entries" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "entry_type" "public"."LedgerEntryType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "movement_type" "public"."StockMovementType" NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "description" TEXT,
    "movement_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hsn_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hsn_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_login_id_key" ON "public"."users"("login_id");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_code_key" ON "public"."chart_of_accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "public"."purchase_orders"("po_number");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_so_number_key" ON "public"."sales_orders"("so_number");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_bills_bill_number_key" ON "public"."vendor_bills"("bill_number");

-- CreateIndex
CREATE UNIQUE INDEX "customer_invoices_invoice_number_key" ON "public"."customer_invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "hsn_codes_code_key" ON "public"."hsn_codes"("code");

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "public"."taxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_orders" ADD CONSTRAINT "sales_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_order_items" ADD CONSTRAINT "sales_order_items_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_order_items" ADD CONSTRAINT "sales_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_order_items" ADD CONSTRAINT "sales_order_items_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "public"."taxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendor_bills" ADD CONSTRAINT "vendor_bills_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendor_bills" ADD CONSTRAINT "vendor_bills_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendor_bill_items" ADD CONSTRAINT "vendor_bill_items_vendor_bill_id_fkey" FOREIGN KEY ("vendor_bill_id") REFERENCES "public"."vendor_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendor_bill_items" ADD CONSTRAINT "vendor_bill_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendor_bill_items" ADD CONSTRAINT "vendor_bill_items_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "public"."taxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_invoices" ADD CONSTRAINT "customer_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_invoices" ADD CONSTRAINT "customer_invoices_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_invoice_items" ADD CONSTRAINT "customer_invoice_items_customer_invoice_id_fkey" FOREIGN KEY ("customer_invoice_id") REFERENCES "public"."customer_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_invoice_items" ADD CONSTRAINT "customer_invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_invoice_items" ADD CONSTRAINT "customer_invoice_items_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "public"."taxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_payments" ADD CONSTRAINT "bill_payments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_payments" ADD CONSTRAINT "bill_payments_vendor_bill_id_fkey" FOREIGN KEY ("vendor_bill_id") REFERENCES "public"."vendor_bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_payments" ADD CONSTRAINT "invoice_payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_payments" ADD CONSTRAINT "invoice_payments_customer_invoice_id_fkey" FOREIGN KEY ("customer_invoice_id") REFERENCES "public"."customer_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ledger_entries" ADD CONSTRAINT "ledger_entries_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
