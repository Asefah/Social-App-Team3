import { verifyAuthToken } from '../auth_logic.js';
import { getUserByUsername } from '../database/models/users_model.js';

/** Sets `req.authUser` when a valid Bearer token is present; otherwise continues without it. */
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAuthToken(token);
    const username =
      typeof payload === 'object' && payload && 'sub' in payload
        ? String(payload.sub)
        : null;
    if (!username) {
      next();
      return;
    }
    const user = await getUserByUsername(username);
    if (user && user.active !== false) {
      req.authUser = user;
    }
    next();
  } catch {
    next();
  }
}
