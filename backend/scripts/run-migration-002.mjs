/**
 * Applies database/migrations/002_forum_post_kind.sql using DB_* from backend/.env
 * (same as the API). Run from repo root:
 *   npm run db:migrate:002 --prefix backend
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "../loadEnv.js";
import pool from "../database/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "../database/migrations/002_forum_post_kind.sql");

const sql = readFileSync(file, "utf8");

try {
  await pool.query(sql);
  console.log("Applied:", file);
  process.exit(0);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await pool.end().catch(() => {});
}
