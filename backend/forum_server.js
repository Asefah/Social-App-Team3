import bcrypt from 'bcrypt';
import express from 'express';
import {
    createNewPost,
    getAllPosts,
    getPostDetails,
    updateExistingPost,
    deleteExistingPost,
    getPostByCategory,
    likePost,
    dislikePost
} from "./forum_logic.js";


const app = express();
const PORT = 5050;

app.use(express.json());

app.post('/posts', async (req, res) => {
    try {
        const { username, title, content } = req.body;
        const newPost = await createNewPost(username, title, content);
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/posts', async (req, res) => {
    try {
        const posts = await getAllPosts();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const post = await getPostDetails(id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const updatedPost = await updateExistingPost(id, title, content);
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPost = await deleteExistingPost(id);
        if (!deletedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.status(200).json(deletedPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/posts/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const posts = await getPostByCategory(category);
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/posts/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        await likePost(id);
        res.status(200).json({ message: 'Post liked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/posts/:id/dislike', async (req, res) => {
    try {
        const { id } = req.params;
        await dislikePost(id);
        res.status(200).json({ message: 'Post disliked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

