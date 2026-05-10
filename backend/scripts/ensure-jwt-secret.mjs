/**
 * Runs before server.js. If JWT_SECRET is still unset after loading .env files,
 * writes one into backend/.env so local/EC2 boot does not fail on a missing secret.
 * For production, replace it with a stable secret you control.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");
const envPath = path.join(backendRoot, ".env");
const examplePath = path.join(backendRoot, ".env.example");

dotenv.config({ path: path.join(backendRoot, "..", ".env") });
dotenv.config({ path: envPath, override: true });

if (String(process.env.JWT_SECRET ?? "").trim()) {
  process.exit(0);
}

const secret = crypto.randomBytes(32).toString("hex");

let body = "";
if (fs.existsSync(envPath)) {
  body = fs.readFileSync(envPath, "utf8");
} else if (fs.existsSync(examplePath)) {
  body = fs.readFileSync(examplePath, "utf8");
}

if (/^JWT_SECRET=/m.test(body)) {
  body = body.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
} else {
  const trimmed = body.replace(/\s+$/u, "");
  body = `${trimmed}${trimmed ? "\n" : ""}JWT_SECRET=${secret}\n`;
}

fs.writeFileSync(envPath, body, "utf8");
console.warn(
  "[backend] JWT_SECRET was missing — wrote a new random value to backend/.env. Add DB_* (and review JWT_SECRET for production), then restart if needed."
);
process.exit(0);
