/**
 * Load env before any other backend module reads process.env (ESM hoists
 * imports, so dotenv in server.js after imports was too late for db.js Pool).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '.env'), override: true });
