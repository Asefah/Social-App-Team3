import '../loadEnv.js';
import pkg from 'pg';

const { Pool } = pkg;

const dbUser = String(process.env.DB_USER ?? '').trim();
const dbName = String(process.env.DB_NAME ?? '').trim();

if (!dbUser || !dbName) {
  console.error(
    'FATAL: DB_USER and DB_NAME must be set in backend/.env (or repo-root .env).\n' +
      'Without DB_NAME, the client defaults the database to your OS username (e.g. camillepaul), which often does not exist.\n' +
      'Homebrew Postgres often uses your macOS username as the DB superuser — try DB_USER=' +
      (process.env.USER || 'you') +
      ' if login as postgres fails.\n' +
      'Then: copy backend/.env.example → backend/.env, edit values, run:\n' +
      '  npm run db:create --prefix backend\n' +
      '  (from backend/) psql -h localhost -U postgres -d umassconnect -f database/schema.sql\n' +
      '  (use the same -U and -d as DB_USER and DB_NAME in backend/.env — not the literal text YOUR_DB_USER)\n' +
      '  npm run db:ping'
  );
  process.exit(1);
}

const pool = new Pool({
  user: dbUser,
  host: process.env.DB_HOST || 'localhost',
  database: dbName,
  password:
    process.env.DB_PASSWORD === '' || process.env.DB_PASSWORD == null
      ? undefined
      : process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

export default pool;
