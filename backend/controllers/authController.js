import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const sanitizeName = (name) => {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 10) || 'user';
};

const generateUsername = async (name) => {
  const base = sanitizeName(name);
  let username = base;
  let attempt = 0;

  while (await User.findOne({ username })) {
    attempt += 1;
    username = `${base}${Math.floor(100 + Math.random() * 900)}`;
    if (attempt > 10) {
      username = `${base}${Date.now().toString().slice(-4)}`;
      break;
    }
  }

  return username;
};

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  followersCount: user.followers?.length || 0,
  followingCount: user.following?.length || 0,
  createdAt: user.createdAt,
});

const createToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return jwt.sign({ userId: user._id }, jwtSecret, {
    expiresIn: '7d',
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const username = await generateUsername(name);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      username,
      password: hashedPassword,
    });

    const token = createToken(user);
    return res.status(201).json({ user: buildUserPayload(user), token });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Unable to create account.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createToken(user);
    return res.json({ user: buildUserPayload(user), token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Unable to authenticate user.' });
  }
};

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&rounded=true';

export const googleAuth = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Google user information is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const username = await generateUsername(name);
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        username,
        avatar: req.body.avatar || DEFAULT_AVATAR,
      });
    } else if (req.body.avatar && (!user.avatar || user.avatar === DEFAULT_AVATAR)) {
      // if existing user has default avatar, prefer Google avatar
      user.avatar = req.body.avatar;
      await user.save();
    }

    const token = createToken(user);
    return res.json({ user: buildUserPayload(user), token });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ error: 'Unable to sign in with Google.' });
  }
};
