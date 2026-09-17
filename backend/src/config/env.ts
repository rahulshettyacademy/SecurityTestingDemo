import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "5000", 10),
  jwtSecret: required("JWT_SECRET", "rsa-secureshop-dummy-local-training-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "2h",
  db: {
    host: required("DB_HOST", "localhost"),
    port: parseInt(process.env.DB_PORT ?? "5432", 10),
    user: required("DB_USER", "secureshop"),
    password: required("DB_PASSWORD", "secureshop_dev_password"),
    database: required("DB_NAME", "secureshop"),
  },
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origin) => origin.trim()),
};
