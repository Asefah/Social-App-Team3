import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';

jest.unstable_mockModule('../database/models/users_model.js', () => ({
  getUserByEmail: jest.fn(),
  getUserByUsername: jest.fn(),
  createUser: jest.fn(),
}));

const userModel = await import('../database/models/users_model.js');
const { loginUser, registerUser } = await import('../auth_logic.js');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('loginUser', () => {

  test('logs in successfully with correct credentials', async () => {
    const mockUser = {
      email: 'test@umass.edu',
      hashed_password: await bcrypt.hash('password123', 10),
      active: true,
      username: 'testuser'
    };

    userModel.getUserByEmail.mockResolvedValue(mockUser);

    const result = await loginUser({
      email: 'test@umass.edu',
      password: 'password123'
    });

    expect(result.email).toBe('test@umass.edu');
  });

  test('throws error if user does not exist', async () => {
    userModel.getUserByEmail.mockResolvedValue(null);

    await expect(
      loginUser({ email: 'fake@umass.edu', password: 'password123' })
    ).rejects.toThrow('Invalid email or password.');
  });

  test('throws error for wrong password', async () => {
    const mockUser = {
      email: 'test@umass.edu',
      hashed_password: await bcrypt.hash('correctpass', 10),
      active: true
    };

    userModel.getUserByEmail.mockResolvedValue(mockUser);

    await expect(
      loginUser({ email: 'test@umass.edu', password: 'wrongpass' })
    ).rejects.toThrow('Invalid email or password.');
  });

  test('throws error if account is inactive', async () => {
    const mockUser = {
      email: 'test@umass.edu',
      hashed_password: await bcrypt.hash('password123', 10),
      active: false
    };

    userModel.getUserByEmail.mockResolvedValue(mockUser);

    await expect(
      loginUser({ email: 'test@umass.edu', password: 'password123' })
    ).rejects.toThrow('This account has been deactivated.');
  });

});

describe('registerUser', () => {

  test('throws error for invalid email domain', async () => {
    await expect(
      registerUser({
        username: 'testuser',
        email: 'test@gmail.com',
        password: 'password123'
      })
    ).rejects.toThrow('Please use a valid Five College email address.');
  });

  test('throws error for short password', async () => {
    await expect(
      registerUser({
        username: 'testuser',
        email: 'test@umass.edu',
        password: '123'
      })
    ).rejects.toThrow('Password must be at least 8 characters long.');
  });

  test('throws error if email already exists', async () => {
    userModel.getUserByEmail.mockResolvedValue({ email: 'test@umass.edu' });

    await expect(
      registerUser({
        username: 'testuser',
        email: 'test@umass.edu',
        password: 'password123'
      })
    ).rejects.toThrow('An account with this email already exists.');
  });

  test('throws error if username already exists', async () => {
    userModel.getUserByEmail.mockResolvedValue(null);
    userModel.getUserByUsername.mockResolvedValue({ username: 'testuser' });

    await expect(
      registerUser({
        username: 'testuser',
        email: 'test@umass.edu',
        password: 'password123'
      })
    ).rejects.toThrow('This username is already taken.');
  });
test('throws error if username, email, or password is missing', async () => {
  await expect(
    registerUser({
      username: '',
      email: 'test@umass.edu',
      password: 'password123'
    })
  ).rejects.toThrow('Username, email, and password are required.');
});
test('throws error for invalid username', async () => {
  await expect(
    registerUser({
      username: 'ab',
      email: 'test@umass.edu',
      password: 'password123'
    })
  ).rejects.toThrow(
    'Username must be 3-50 characters and contain only letters, numbers, and underscores.'
  );
});
test('throws error for username with invalid characters', async () => {
  await expect(
    registerUser({
      username: 'test-user!',
      email: 'test@umass.edu',
      password: 'password123'
    })
  ).rejects.toThrow(
    'Username must be 3-50 characters and contain only letters, numbers, and underscores.'
  );
});
test('throws error for invalid email format', async () => {
  await expect(
    registerUser({
      username: 'testuser',
      email: 'test@@umass.edu',
      password: 'password123'
    })
  ).rejects.toThrow('Please use a valid Five College email address.');
});
test('throws error if login email or password is missing', async () => {
  await expect(
    loginUser({
      email: '',
      password: 'password123'
    })
  ).rejects.toThrow('Email and password are required.');
});
test('registers user successfully with trimmed full name', async () => {
  userModel.getUserByEmail.mockResolvedValue(null);
  userModel.getUserByUsername.mockResolvedValue(null);

  userModel.createUser.mockResolvedValue({
    username: 'testuser',
    email: 'test@umass.edu',
    full_name: 'Test User',
    created_at: new Date(),
    active: true
  });

  const result = await registerUser({
    username: ' testuser ',
    email: ' TEST@UMASS.EDU ',
    password: 'password123',
    fullName: ' Test User '
  });

  expect(userModel.createUser).toHaveBeenCalled();
  expect(result.full_name).toBe('Test User');
});

  test('registers user successfully', async () => {
    userModel.getUserByEmail.mockResolvedValue(null);
    userModel.getUserByUsername.mockResolvedValue(null);

    userModel.createUser.mockResolvedValue({
      username: 'testuser',
      email: 'test@umass.edu',
      full_name: null,
      created_at: new Date(),
      active: true
    });

    const result = await registerUser({
      username: 'testuser',
      email: 'test@umass.edu',
      password: 'password123'
    });

    expect(result.email).toBe('test@umass.edu');
  });

});