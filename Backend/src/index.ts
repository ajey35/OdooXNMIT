import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import * as dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import productRoutes from "./routes/product.routes.js";
import taxRoutes from "./routes/tax.routes.js";
import chartOfAccountRoutes from "./routes/chartOfAccount.routes.js";
import purchaseOrderRoutes from "./routes/purchaseOrder.routes.js";
import salesOrderRoutes from "./routes/salesOrder.routes.js";
import vendorBillRoutes from "./routes/vendorBill.routes.js";
import customerInvoiceRoutes from "./routes/customerInvoice.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import reportRoutes from "./routes/report.routes.js";
import hsnRoutes from "./routes/hsn.routes.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize server
async function startServer() {
  // Security middleware
  // app.use(helmet());
  console.log("env",process.env.CORS_ORIGIN);
  
  // app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3001', credentials: true }) as any);
  // app.use(cors());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10), // limit each IP
    message: "Too many requests from this IP, please try again later.",
  });
  // app.use(limiter);

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Use CORS to allow all origins
  app.use(cors() as any);

  // Compression middleware
  // app.use(compression());

  // Logging middleware
  // app.use(morgan("combined"));

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  });


  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/contacts", contactRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/taxes", taxRoutes);
  app.use("/api/chart-of-accounts", chartOfAccountRoutes);
  app.use("/api/purchase-orders", purchaseOrderRoutes);
  app.use("/api/sales-orders", salesOrderRoutes);
  app.use("/api/vendor-bills", vendorBillRoutes);
  app.use("/api/customer-invoices", customerInvoiceRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/hsn", hsnRoutes);

  // Swagger documentation
  if (process.env.NODE_ENV !== "production") {
    const swaggerUi = await import("swagger-ui-express");
    const swaggerDocument = await import("../docs/swagger.json", {
      assert: { type: "json" },
    });

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument.default));
  }

  // Error handling middleware
  app.use(notFound);
  app.use(errorHandler);

  // Start server
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📄 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`💓 Health: http://localhost:${PORT}/health`);
  });
}

// Start the server
startServer().catch(console.error);

export default app;
