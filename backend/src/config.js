require("dotenv").config();

const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret_before_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
};

module.exports = { config };
