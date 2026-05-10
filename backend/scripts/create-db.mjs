/**
 * Creates DB_NAME if missing (connects to maintenance db "postgres").
 * Requires DB_USER, DB_NAME, DB_HOST, DB_PORT in .env (see backend/.env.example).
 * Run: npm run db:create --prefix backend
 */
import pg from "pg";
import "../loadEnv.js";

const { Client } = pg;

const dbUser = String(process.env.DB_USER ?? "").trim();
const dbName = String(process.env.DB_NAME ?? "").trim();
const dbHost = String(process.env.DB_HOST ?? "localhost").trim();
const dbPort = Number(process.env.DB_PORT) || 5432;
const dbPassword = process.env.DB_PASSWORD;

if (!dbUser || !dbName) {
  console.error(
    "Set DB_USER and DB_NAME in backend/.env first (copy from .env.example)."
  );
  process.exit(1);
}

if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbName)) {
  console.error(
    "DB_NAME must be a single Postgres identifier (letters, numbers, underscore; start with letter or _)."
  );
  process.exit(1);
}

const admin = new Client({
  user: dbUser,
  password: dbPassword === "" || dbPassword == null ? undefined : dbPassword,
  host: dbHost,
  port: dbPort,
  database: "postgres",
});

try {
  await admin.connect();
  const { rowCount } = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName]
  );
  if (rowCount) {
    console.log(`Database "${dbName}" already exists.`);
    process.exit(0);
  }
  await admin.query(`CREATE DATABASE ${dbName}`);
  console.log(`Created database "${dbName}".`);
  console.log(
    "Next: from the backend/ directory, load the schema (use your real DB user and name):\n" +
      `  psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f database/schema.sql`
  );
  process.exit(0);
} catch (e) {
  console.error("create-db failed:", e instanceof Error ? e.message : e);
  console.error(
    "\nIf permission denied, connect as a superuser (often your macOS username after Homebrew install) or run:\n  createdb " +
      dbName
  );
  process.exit(1);
} finally {
  await admin.end().catch(() => {});
}
