import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  IconButton,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

function Feed() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (fetchError) {
      console.error(fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    setError('');
    if (!content.trim() && !selectedImage) {
      setError('Add a message or choose an image.');
      return;
    }

    setPosting(true);
    const formData = new FormData();
    formData.append('content', content);
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    try {
      const response = await api.post('/posts', formData);
      setPosts((prev) => [response.data, ...prev]);
      setContent('');
      removeSelectedImage();
      setError('');
    } catch (createError) {
      const serverMessage = createError.response?.data?.error;
      if (selectedImage && serverMessage) {
        // Show server/cloudinary error only when an image was being uploaded
        setError(serverMessage);
      } else {
        setError('Unable to publish post.');
      }
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const currentPost = posts.find((post) => post._id === postId);
    if (!currentPost) return;

    const optimisticPost = {
      ...currentPost,
      likedByCurrentUser: !currentPost.likedByCurrentUser,
      likeCount: Math.max(0, currentPost.likeCount + (currentPost.likedByCurrentUser ? -1 : 1)),
    };

    setPosts((prev) => prev.map((post) => (post._id === postId ? optimisticPost : post)));

    try {
      const response = await api.patch(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                likeCount: response.data.likeCount,
                likedByCurrentUser: response.data.likedByCurrentUser,
              }
            : post
        )
      );
    } catch (likeError) {
      console.error('Like toggle failed:', likeError);
      setPosts((prev) => prev.map((post) => (post._id === postId ? currentPost : post)));
    }
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => prev.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prev) => prev.filter((post) => post._id !== deletedPostId));
  };

  return (
    <Stack spacing={2}>
      <Card sx={{ borderRadius: 4, boxShadow: 3, p: 2 }}>
        {isAuthenticated ? (
          <Stack component="form" spacing={1} onSubmit={handleCreatePost}>
            <Stack direction="row" alignItems="center" spacing={2}>
              {(() => {
                const isPlaceholder = user?.avatar?.includes('ui-avatars.com');
                const initial = user?.name?.[0]?.toUpperCase();
                return (
                  <Avatar src={isPlaceholder ? undefined : user?.avatar} sx={{ width: 48, height: 48 }}>
                    {!user?.avatar || isPlaceholder ? initial : null}
                  </Avatar>
                );
              })()}
              <Typography variant="h6">Create a post</Typography>
            </Stack>
            <TextField
              label="What’s on your mind?"
              multiline
              minRows={3}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<ImageOutlinedIcon />}
              >
                Add photo
              </Button>
              <input
                ref={fileInputRef}
                hidden
                accept="image/*"
                type="file"
                onChange={handleImageChange}
              />
              <Box sx={{ flex: 1 }} />
              <Button type="submit" variant="contained" disabled={posting}>
                {posting ? 'Posting...' : 'Post'}
              </Button>
            </Stack>
            {selectedImage && (
              <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Box component="img" src={imagePreview} alt="Preview" sx={{ width: '100%', height: 180, objectFit: 'cover' }} />
                <IconButton
                  size="small"
                  onClick={removeSelectedImage}
                  sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper' }}
                >
                  <RemoveCircleOutlineIcon />
                </IconButton>
              </Box>
            )}
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography variant="h6">Login to create a post</Typography>
            <Typography color="text.secondary">Browse the feed and visit profiles.</Typography>
            <Button variant="contained" onClick={() => navigate('/login')}>
              Login
            </Button>
          </Stack>
        )}
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : posts.length ? (
        posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLike={handleToggleLike}
            onUpdate={handlePostUpdated}
            onDelete={handlePostDeleted}
          />
        ))
      ) : (
        <Card sx={{ borderRadius: 4, boxShadow: 3, p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No posts yet</Typography>
          <Typography color="text.secondary">Be the first to share a story.</Typography>
        </Card>
      )}
    </Stack>
  );
}

export default Feed;
