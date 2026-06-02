import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const jwtSecret = process.env.JWT_SECRET;

export const attachUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, jwtSecret);
      req.userId = payload.userId;
      req.user = await User.findById(payload.userId).select('-password');
    } catch {
      req.userId = null;
      req.user = null;
    }
  }

  next();
};

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
