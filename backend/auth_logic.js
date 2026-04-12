import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail, getUserByUsername } from './database/models/users_model.js';

const ALLOWED_EMAIL_DOMAINS = [
  'umass.edu',
  'amherst.edu',
  'hampshire.edu',
  'smith.edu',
  'mtholyoke.edu'
];

const SALT_ROUNDS = 10;

const isValidFiveCollegeEmail = (email) => {
  if (!email || typeof email !== 'string') return false;

  const normalizedEmail = email.trim().toLowerCase();
  const parts = normalizedEmail.split('@');

  if (parts.length !== 2) return false;

  const domain = parts[1];
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8;
};

const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false;

  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 50) return false;

  return /^[a-zA-Z0-9_]+$/.test(trimmed);
};

const sanitizeUser = (user) => {
  return {
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    user_school: user.user_school,
    user_major: user.user_major,
    user_year: user.user_year,
    user_bio: user.user_bio,
    created_at: user.created_at,
    active: user.active
  };
};

export const registerUser = async ({ username, email, password, fullName }) => {
  if (!username || !email || !password) {
    throw new Error('Username, email, and password are required.');
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFullName = fullName ? fullName.trim() : null;

  if (!isValidUsername(normalizedUsername)) {
    throw new Error('Username must be 3-50 characters and contain only letters, numbers, and underscores.');
  }

  if (!isValidFiveCollegeEmail(normalizedEmail)) {
    throw new Error('Please use a valid Five College email address.');
  }

  if (!isValidPassword(password)) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const existingEmailUser = await getUserByEmail(normalizedEmail);
  if (existingEmailUser) {
    throw new Error('An account with this email already exists.');
  }

  const existingUsernameUser = await getUserByUsername(normalizedUsername);
  if (existingUsernameUser) {
    throw new Error('This username is already taken.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = await createUser(
    normalizedUsername,
    normalizedEmail,
    passwordHash,
    normalizedFullName
  );

  return sanitizeUser(newUser);
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await getUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  if (!user.active) {
    throw new Error('This account has been deactivated.');
  }

  const passwordMatches = await bcrypt.compare(password, user.hashed_password);

  if (!passwordMatches) {
    throw new Error('Invalid email or password.');
  }

  return sanitizeUser(user);
};