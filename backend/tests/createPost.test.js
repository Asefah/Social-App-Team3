import { jest } from '@jest/globals';
jest.unstable_mockModule('../database/models/forums_model.js', () => ({
  createForum: jest.fn(),
}));

const forumModel = await import('../database/models/forums_model.js');
const { createNewPost } = await import('../createpost.js');
beforeEach(() => {
  jest.clearAllMocks();
});

describe('createNewPost', () => {

  test('throws error if username or content missing', async () => {
    await expect(
      createNewPost({ username: '', content: '' })
    ).rejects.toThrow('User ID and content are required.');
  });

  test('throws error for empty content', async () => {
    await expect(
      createNewPost({ username: 'testuser', content: '   ' })
    ).rejects.toThrow();
  });

  test('throws error for too long content', async () => {
    const longContent = 'a'.repeat(6000);

    await expect(
      createNewPost({ username: 'testuser', content: longContent })
    ).rejects.toThrow();
  });

  test('creates post successfully', async () => {
    const mockPost = {
      post_id: 1,
      username: 'testuser',
      category: 'general',
      content: 'hello world'
    };

    forumModel.createForum.mockResolvedValue(mockPost);

    const result = await createNewPost({
      username: 'testuser',
      content: 'hello world'
    });

    expect(result).toEqual({
      post_id: 1,
      username: 'testuser',
      category: 'general',
      content: 'hello world'
    });
  });

});