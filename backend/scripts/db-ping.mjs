/**
 * Verifies DB_* in .env using the same pool config as the API.
 * Run: npm run db:ping --prefix backend
 */
import "../loadEnv.js";
import pool from "../database/db.js";

const host = process.env.DB_HOST || "localhost";
const port = process.env.DB_PORT || "5432";
const db = process.env.DB_NAME || "(unset DB_NAME)";
const user = process.env.DB_USER || "(unset DB_USER)";

try {
  const { rows } = await pool.query("SELECT 1 AS ok");
  console.log(`Database OK (${host}:${port}, db=${db}, user=${user}):`, rows[0]);
  process.exit(0);
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("Database connection failed:", msg);
  console.error("\nTypical fixes on macOS (Apple Silicon):");
  console.error(
    "  1. Install the server (libpq is only the client):  brew install postgresql@16"
  );
  console.error(
    "  2. Start Postgres:  brew services start postgresql@16"
  );
  console.error(
    "  3. Create DB/user to match backend/.env, then apply schema:  backend/database/schema.sql"
  );
  console.error(
    "  4. If you only installed libpq, add psql to PATH for this shell:\n     export PATH=\"/opt/homebrew/opt/libpq/bin:$PATH\""
  );
  console.error(`\nCurrent target: ${host}:${port}  database=${db}  user=${user}\n`);
  process.exit(1);
} finally {
  await pool.end().catch(() => {});
}
