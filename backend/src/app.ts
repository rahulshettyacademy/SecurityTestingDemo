import cors from "cors";
import express, { Express } from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import orderRoutes from "./routes/orderRoutes";
import passwordResetRoutes from "./routes/passwordResetRoutes";
import productRoutes from "./routes/productRoutes";
import profileRoutes from "./routes/profileRoutes";

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.corsOrigins }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "rsa-secureshop-backend" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/password-reset", passwordResetRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
