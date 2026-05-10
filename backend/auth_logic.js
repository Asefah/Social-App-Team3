import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  createUser,
  getUserByEmail,
  getUserByUsername,
  getUserByUsernameWithPostCount,
} from './database/models/users_model.js';

const ALLOWED_EMAIL_DOMAINS = [
  'umass.edu',
  'amherst.edu',
  'hampshire.edu',
  'smith.edu',
  'mtholyoke.edu'
];

/** Must match signup UI — stored in `users.user_school` */
const FIVE_COLLEGE_SCHOOL_NAMES = [
  'UMass Amherst',
  'Amherst College',
  'Hampshire College',
  'Smith College',
  'Mount Holyoke College'
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

const isValidFiveCollegeSchool = (school) => {
  if (!school || typeof school !== 'string') return false;
  return FIVE_COLLEGE_SCHOOL_NAMES.includes(school.trim());
};

const isNonEmptyProfileField = (value, fieldLabel, maxLen) => {
  if (!value || typeof value !== 'string') {
    throw new Error(`${fieldLabel} is required.`);
  }
  const t = value.trim();
  if (!t) {
    throw new Error(`${fieldLabel} is required.`);
  }
  if (t.length > maxLen) {
    throw new Error(`${fieldLabel} must be at most ${maxLen} characters.`);
  }
  return t;
};

export const sanitizeUser = (user) => {
  return {
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    user_school: user.user_school,
    user_major: user.user_major,
    user_year: user.user_year,
    user_bio: user.user_bio,
    avatar_url: user.avatar_url ?? null,
    created_at: user.created_at,
    active: user.active,
    posts: user.posts ?? 0,
    followers: user.followers ?? 0,
    following: user.user_following ?? 0,
  };
};

/** Public profile (no email); use for other users' profiles. */
export const sanitizePublicUser = (user) => {
  return {
    username: user.username,
    full_name: user.full_name,
    user_school: user.user_school,
    user_major: user.user_major,
    user_year: user.user_year,
    user_bio: user.user_bio,
    avatar_url: user.avatar_url ?? null,
    created_at: user.created_at,
    active: user.active,
    posts: user.posts ?? 0,
    followers: user.followers ?? 0,
    following: user.user_following ?? 0,
  };
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string') {
    throw new Error('JWT_SECRET is not set. Add it to backend/.env');
  }
  return secret;
};

/** @param {{ username: string }} user */
export const signAuthToken = (user) => {
  return jwt.sign({ sub: user.username }, getJwtSecret(), { expiresIn: '7d' });
};

export const verifyAuthToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

export const registerUser = async ({
  username,
  email,
  password,
  fullName,
  userSchool,
  userMajor,
  userYear
}) => {
  if (!username || !email || !password) {
    throw new Error('Username, email, and password are required.');
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFullName = fullName ? fullName.trim() : null;

  if (!normalizedFullName) {
    throw new Error('Full name is required.');
  }

  if (!isValidUsername(normalizedUsername)) {
    throw new Error('Username must be 3-50 characters and contain only letters, numbers, and underscores.');
  }

  if (!isValidFiveCollegeEmail(normalizedEmail)) {
    throw new Error('Please use a valid Five College email address.');
  }

  if (!isValidPassword(password)) {
    throw new Error('Password must be at least 8 characters long.');
  }

  if (!isValidFiveCollegeSchool(userSchool)) {
    throw new Error('Please select one of the Five Colleges.');
  }
  const schoolStored = userSchool.trim();
  const majorStored = isNonEmptyProfileField(userMajor, 'Major', 255);
  const yearStored = isNonEmptyProfileField(userYear, 'Class year', 50);

  const existingEmailUser = await getUserByEmail(normalizedEmail);
  if (existingEmailUser) {
    throw new Error(
      'An account with this email already exists. Use Log in with that email, or use a different email.'
    );
  }

  const existingUsernameUser = await getUserByUsername(normalizedUsername);
  if (existingUsernameUser) {
    throw new Error(
      'This username is already taken. Pick another username or log in if that account is yours.'
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = await createUser(
    normalizedUsername,
    normalizedEmail,
    passwordHash,
    normalizedFullName,
    schoolStored,
    majorStored,
    yearStored
  );

  const withPosts = await getUserByUsernameWithPostCount(newUser.username);
  return sanitizeUser(withPosts ?? newUser);
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

  if (user.active === false) {
    throw new Error('This account has been deactivated.');
  }

  const passwordMatches = await bcrypt.compare(password, user.hashed_password);

  if (!passwordMatches) {
    throw new Error('Invalid email or password.');
  }

  const withPosts = await getUserByUsernameWithPostCount(user.username);
  return sanitizeUser(withPosts ?? user);
};