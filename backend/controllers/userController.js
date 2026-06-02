import User from '../models/User.js';
import Post from '../models/Post.js';
import { uploadImage, isCloudinaryEnabled } from '../utils/cloudinary.js';

export const getUserProfile = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase().trim();
    const user = await User.findOne({ username }).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const postsCount = await Post.countDocuments({ user: user._id });

    // Check if current user is following this user
    let isFollowing = false;
    if (req.userId) {
      const currentUser = await User.findById(req.userId).lean();
      isFollowing = currentUser?.following?.some((id) => id.toString() === user._id.toString()) || false;
    }

    return res.json({
      id: user._id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      postsCount,
      isFollowing,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Unable to load profile.' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    return res.json(req.user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Unable to load user profile.' });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    console.log('Update profile request body:', req.body);
    console.log('Update profile request file:', req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : null);

    const { name, bio } = req.body;
    const updates = {};

    if (name?.trim()) {
      updates.name = name.trim();
    }
    if (bio !== undefined) {
      updates.bio = bio;
    }

    if (req.file) {
      if (isCloudinaryEnabled()) {
        updates.avatar = await uploadImage(req.file.buffer);
      } else {
        console.warn('Cloudinary is not configured; avatar upload skipped.');
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
    }).select('-password');

    return res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Unable to update profile.' });
  }
};

export const deleteCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Use findByIdAndDelete to trigger schema middleware (findOneAndDelete)
    await User.findByIdAndDelete(req.userId);

    return res.json({ message: 'Account and related posts deleted.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Unable to delete user.' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const searchRegex = new RegExp(query, 'i');
    const users = await User.find({
      $or: [
        { username: { $regex: searchRegex } },
        { name: { $regex: searchRegex } },
      ],
    })
      .select('_id name username avatar bio')
      .limit(20)
      .lean();

    const results = await Promise.all(
      users.map(async (user) => ({
        ...user,
        postsCount: await Post.countDocuments({ user: user._id }),
      }))
    );

    res.json(results);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Unable to search users.' });
  }
};

export const followUser = async (req, res) => {
  try {
    const targetUsername = req.params.username.toLowerCase().trim();
    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findOne({ username: targetUsername });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (currentUser._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    // Check if already following
    const isFollowing = currentUser.following.some((id) => id.toString() === targetUser._id.toString());
    if (isFollowing) {
      return res.status(400).json({ error: 'You are already following this user.' });
    }

    // Add to following and followers
    currentUser.following.push(targetUser._id);
    targetUser.followers.push(currentUser._id);

    await currentUser.save();
    await targetUser.save();

    res.json({
      message: 'User followed.',
      followingCount: currentUser.following.length,
      targetFollowersCount: targetUser.followers.length,
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Unable to follow user.' });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const targetUsername = req.params.username.toLowerCase().trim();
    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findOne({ username: targetUsername });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if following
    const followingIndex = currentUser.following.findIndex((id) => id.toString() === targetUser._id.toString());
    if (followingIndex < 0) {
      return res.status(400).json({ error: 'You are not following this user.' });
    }

    const followerIndex = targetUser.followers.findIndex((id) => id.toString() === currentUser._id.toString());

    // Remove from following and followers
    currentUser.following.splice(followingIndex, 1);
    if (followerIndex >= 0) {
      targetUser.followers.splice(followerIndex, 1);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      message: 'User unfollowed.',
      followingCount: currentUser.following.length,
      targetFollowersCount: targetUser.followers.length,
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Unable to unfollow user.' });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase().trim();
    const user = await User.findOne({ username })
      .populate('followers', '_id name username avatar')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user.followers || []);
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Unable to load followers.' });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase().trim();
    const user = await User.findOne({ username })
      .populate('following', '_id name username avatar')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user.following || []);
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Unable to load following.' });
  }
};
