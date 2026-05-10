/**
 * Never return an empty string to the client — some Errors have no message,
 * and node-pg errors may need code/detail for a useful string.
 * @param {unknown} err
 * @param {string} fallback
 */
export function toClientErrorMessage(err, fallback) {
  if (typeof err === 'string' && err.trim()) return err.trim();
  if (err instanceof Error) {
    const m = String(err.message ?? '').trim();
    if (m) return m;
  }
  if (err && typeof err === 'object') {
    const o = /** @type {Record<string, unknown>} */ (err);
    const msg = typeof o.message === 'string' ? o.message.trim() : '';
    if (msg) return msg;
    if (o.code === 'ECONNREFUSED') {
      const host = process.env.DB_HOST || 'localhost';
      const port = process.env.DB_PORT || '5432';
      return `${fallback} — cannot connect to PostgreSQL at ${host}:${port}. Start Postgres and set DB_* in backend/.env (run: npm run db:ping --prefix backend).`;
    }
    if (Array.isArray(o.errors) && o.errors.length > 0) {
      const first = o.errors[0];
      if (first instanceof Error && String(first.message || '').trim()) {
        return `${String(first.message).trim()} (${fallback})`;
      }
    }
    const code = typeof o.code === 'string' ? o.code : '';
    const detail = typeof o.detail === 'string' ? o.detail.trim() : '';
    const constraint = typeof o.constraint === 'string' ? o.constraint : '';
    const parts = [fallback];
    if (code) parts.push(`code ${code}`);
    if (constraint) parts.push(`constraint ${constraint}`);
    if (detail) parts.push(detail);
    if (parts.length > 1) return parts.join(' — ');
  }
  return fallback;
}
