import bcrypt from 'bcrypt';
import express from 'express';
import { loginUser, registerUser } from './auth_logic.js';
import {
  getUserByEmail,
  getUserByUsername,
  updateUserProfile,
  updatePassword,
  getUserFollowersCount,
  getUserFollowingCount
} from './database/models/users_model.js';



const app = express();
const PORT = 5000;

app.use(express.json());

app.post('/login', async (req, res) => {
  try {
    const user = await loginUser(req.body);
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const user = await registerUser(req.body);
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/profile', async (req, res) => {
  const { username } = req.query;

  const user = await getUserByUsername(username);

  if (user) {
    return res.json({ success: true, user });
  }

  return res.status(404).json({ success: false });
});

app.get('/user-by-email', async (req, res) => {
  const { email } = req.query;

  const user = await getUserByEmail(email);

  if (user) {
    return res.json({ success: true, user });
  }

  return res.status(404).json({ success: false });
});

app.put('/update-profile', async (req, res) => {
  const { username, fullName, userSchool, userMajor, userYear, userBio } = req.body;

  const user = await updateUserProfile(
    username,
    fullName,
    userSchool,
    userMajor,
    userYear,
    userBio
  );

  if (user) {
    return res.json({ success: true, user });
  }

  return res.status(400).json({ success: false });
});

app.put('/update-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  const existingUser = await getUserByUsername(username);
  if (!existingUser) {
    return res.status(404).json({ success: false });
  }

  const passwordMatches = await bcrypt.compare(
    oldPassword,
    existingUser.hashed_password
  );

  if (!passwordMatches) {
    return res.status(401).json({ success: false });
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  const user = await updatePassword(hashedNewPassword, username);

  if (user) {
    return res.json({ success: true, user });
  }

  return res.status(400).json({ success: false });
});

app.get('/user-followers-count', async (req, res) => {
  const { username } = req.query;

  const count = await getUserFollowersCount(username);

  if (count !== undefined) {
    return res.json({ success: true, count });
  }

  return res.status(404).json({ success: false });
});

app.get('/user-following-count', async (req, res) => {
  const { username } = req.query;

  const count = await getUserFollowingCount(username);

  if (count !== undefined) {
    return res.json({ success: true, count });
  }

  return res.status(404).json({ success: false });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
