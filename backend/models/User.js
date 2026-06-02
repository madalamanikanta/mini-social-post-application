import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&rounded=true';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, unique: true, lowercase: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    avatar: { type: String, required: true, default: DEFAULT_AVATAR },
    bio: { type: String, default: '' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);
// Cascade delete posts and remove local images when a user is deleted via findOneAndDelete
userSchema.pre('findOneAndDelete', async function (next) {
  try {
    const filter = this.getFilter();
    const user = await this.model.findOne(filter).lean();
    if (user) {
      // Import Post model dynamically to avoid circular import issues
      const { default: Post } = await import('./Post.js');
      const posts = await Post.find({ user: user._id }).lean();
      for (const p of posts) {
        if (p.image && typeof p.image === 'string' && p.image.includes('/uploads/posts/')) {
          const parts = p.image.split('/uploads/posts/');
          const filename = parts[1];
          if (filename) {
            const filePath = path.join(process.cwd(), 'uploads', 'posts', filename);
            try {
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (e) {
              console.warn('Failed to remove local post image during user delete:', filePath, e);
            }
          }
        }
      }
      await Post.deleteMany({ user: user._id });
    }
  } catch (err) {
    console.error('Error during user cascade delete:', err);
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
