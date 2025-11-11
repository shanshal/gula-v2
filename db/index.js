const { Pool } = require("pg");

const pgSslMode = String(process.env.PGSSLMODE || "").toLowerCase();
const pgSslFlag = String(process.env.PGSSL || "").toLowerCase();

const shouldUseSsl =
  pgSslMode === "require" ||
  pgSslFlag === "true" ||
  (process.env.DATABASE_URL && String(process.env.DATABASE_DISABLE_SSL || "") !== "true");

const buildPoolConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
    };
  }

  return {
    user: process.env.PGUSER || "shanshal",
    host: process.env.PGHOST || "localhost",
    database: process.env.PGDATABASE || "gula_v2_app",
    password: process.env.PGPASSWORD || "RUSTneversl33ps",
    port: Number(process.env.PGPORT) || 5432,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
  };
};

const pool = new Pool(buildPoolConfig());

module.exports = pool;
