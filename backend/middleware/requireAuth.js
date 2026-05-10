import { verifyAuthToken } from '../auth_logic.js';
import { getUserByUsername } from '../database/models/users_model.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization bearer token' });
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
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    const user = await getUserByUsername(username);
    if (!user || user.active === false) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    req.authUser = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
