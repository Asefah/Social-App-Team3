/**
 * Applies database/migrations/003_forum_post_likes.sql (DB_* from backend/.env).
 *   npm run db:migrate:003 --prefix backend
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "../loadEnv.js";
import pool from "../database/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "../database/migrations/003_forum_post_likes.sql");

try {
  await pool.query(readFileSync(file, "utf8"));
  console.log("Applied:", file);
  process.exit(0);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await pool.end().catch(() => {});
}
