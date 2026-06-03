import Post from '../models/Post.js';
import User from '../models/User.js';
import { uploadImage, isCloudinaryEnabled } from '../utils/cloudinary.js';
import fs from 'fs';
import path from 'path';

export const getPosts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.username) {
      const user = await User.findOne({ username: req.query.username.toLowerCase().trim() });
      if (!user) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
      filter.user = user._id;
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name username avatar')
      .lean();

    const payload = posts.map((post) => {
      const likedByCurrentUser = req.userId
        ? post.likes.some((id) => id.toString() === req.userId.toString())
        : false;
      return {
        ...post,
        likeCount: post.likes.length,
        commentsCount: post.comments?.length ?? post.commentsCount ?? 0,
        likedByCurrentUser,
      };
    });

    res.json(payload);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Unable to load posts.' });
  }
};

export const createPost = async (req, res) => {
  try {
    console.log('createPost req.body:', req.body);
    console.log("Cloudinary enabled =", isCloudinaryEnabled());
    console.log("Cloud name =", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("Has API key =", !!process.env.CLOUDINARY_API_KEY);
    console.log("Has API secret =", !!process.env.CLOUDINARY_API_SECRET);
    console.log('createPost req.file:', req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : null);

    const content = req.body.content?.trim();
    const hasImage = Boolean(req.file);

    let imageUrl;
    if (hasImage) {
      if (isCloudinaryEnabled()) {
        try {
          imageUrl = await uploadImage(req.file.buffer);
        } catch (uploadErr) {
          console.error('Cloudinary upload failed:', {
            message: uploadErr?.message,
            name: uploadErr?.name,
            stack: uploadErr?.stack,
          });
          // Don't fail the entire request; proceed without image
        }
      } else {
        // Save locally to backend/uploads/posts
        try {
          const uploadDir = path.join(process.cwd(), 'uploads', 'posts');
          fs.mkdirSync(uploadDir, { recursive: true });
          const safeName = `${Date.now()}-${req.file.originalname.replace(/[^a-z0-9.\-]/gi, '_')}`;
          const filePath = path.join(uploadDir, safeName);
          fs.writeFileSync(filePath, req.file.buffer);
          const host = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
          imageUrl = `${host}/uploads/posts/${safeName}`;
        } catch (localErr) {
          console.error('Local image save failed:', localErr);
        }
      }
    }
    console.log("Image URL saved =", imageUrl);
    const post = await Post.create({
      user: req.userId,
      content: content || '',
      image: imageUrl,
    });

    await post.populate('user', 'name username avatar');

    res.status(201).json({
      ...post.toObject(),
      likeCount: 0,
      likedByCurrentUser: false,
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Unable to create post.' });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name username avatar')
      .lean();

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const likedByCurrentUser = req.userId
      ? post.likes.some((id) => id.toString() === req.userId.toString())
      : false;

    const comments = (post.comments || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      ...post,
      likeCount: post.likes.length,
      commentsCount: comments.length,
      likedByCurrentUser,
      comments,
    });
  } catch (error) {
    console.error('Get post detail error:', error);
    res.status(500).json({ error: 'Unable to load post details.' });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const likedIndex = post.likes.findIndex((id) => id.toString() === req.userId.toString());
    if (likedIndex >= 0) {
      post.likes.splice(likedIndex, 1);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();

    res.json({
      likeCount: post.likes.length,
      likedByCurrentUser: likedIndex < 0,
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Unable to update like status.' });
  }
};

const deleteLocalImageIfNeeded = (imageUrl) => {
  if (!imageUrl || isCloudinaryEnabled()) {
    return;
  }

  const host = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
  const relativePath = imageUrl.startsWith(host) ? imageUrl.replace(host, '') : imageUrl;
  const filePath = path.join(process.cwd(), relativePath.replace(/^\//, ''));

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized to edit this post.' });
    }

    const content = req.body.content?.trim() || '';
    const removeImage = req.body.removeImage === 'true';
    const hasNewImage = Boolean(req.file);

    if (!content && !hasNewImage && (!post.image || removeImage)) {
      return res.status(400).json({ error: 'Post must include text or an image.' });
    }

    if (removeImage && post.image) {
      deleteLocalImageIfNeeded(post.image);
      post.image = undefined;
    }

    if (hasNewImage) {
      if (post.image && !isCloudinaryEnabled()) {
        deleteLocalImageIfNeeded(post.image);
      }

      let imageUrl;
      if (isCloudinaryEnabled()) {
        imageUrl = await uploadImage(req.file.buffer);
      } else {
        const uploadDir = path.join(process.cwd(), 'uploads', 'posts');
        fs.mkdirSync(uploadDir, { recursive: true });
        const safeName = `${Date.now()}-${req.file.originalname.replace(/[^a-z0-9.\-]/gi, '_')}`;
        const filePath = path.join(uploadDir, safeName);
        fs.writeFileSync(filePath, req.file.buffer);
        const host = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
        imageUrl = `${host}/uploads/posts/${safeName}`;
      }
      post.image = imageUrl;
    }

    post.content = content;
    await post.save();
    await post.populate('user', 'name username avatar');

    const likedByCurrentUser = req.userId
      ? post.likes.some((id) => id.toString() === req.userId.toString())
      : false;

    res.json({
      ...post.toObject(),
      likeCount: post.likes.length,
      commentsCount: post.comments?.length ?? post.commentsCount ?? 0,
      likedByCurrentUser,
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Unable to update post.' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized to delete this post.' });
    }

    if (post.image) {
      deleteLocalImageIfNeeded(post.image);
    }

    await post.deleteOne();

    res.json({ message: 'Post deleted.' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Unable to delete post.' });
  }
};

export const getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const comments = (post.comments || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Unable to load comments.' });
  }
};

export const addComment = async (req, res) => {
  try {
    const text = (req.body.text || req.body.content || '').trim();
    if (!text) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    if (text.length > 500) {
      return res.status(400).json({ error: 'Comment must be 500 characters or less.' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const comment = {
      userId: req.user._id,
      username: req.user.username,
      name: req.user.name,
      avatar: req.user.avatar,
      text,
    };

    post.comments.unshift(comment);
    post.commentsCount = (post.comments?.length || 0);
    await post.save();

    const createdComment = post.comments[0].toObject ? post.comments[0].toObject() : post.comments[0];
    res.status(201).json(createdComment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Unable to post comment.' });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (comment.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment.' });
    }

    comment.remove();
    post.commentsCount = Math.max(0, post.comments.length);
    await post.save();

    res.json({ message: 'Comment deleted.', commentsCount: post.commentsCount });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Unable to delete comment.' });
  }
};

export const sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    post.shareCount += 1;
    await post.save();

    res.json({ shareCount: post.shareCount });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ error: 'Unable to update share count.' });
  }
};
