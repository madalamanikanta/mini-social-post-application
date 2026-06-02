import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`);
      setPost(response.data);
    } catch (fetchError) {
      setError(fetchError.response?.data?.error || 'Unable to load post.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const response = await api.patch(`/posts/${id}/like`);
      setPost((prev) => ({ ...prev, likeCount: response.data.likeCount, likedByCurrentUser: response.data.likedByCurrentUser }));
    } catch (likeError) {
      console.error(likeError);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: post?.user.name,
      text: post?.content || 'Check out this post.',
      url: `${window.location.origin}/post/${id}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
      }
      await api.patch(`/posts/${id}/share`);
      setPost((prev) => ({ ...prev, shareCount: (prev.shareCount || 0) + 1 }));
    } catch (shareError) {
      console.error(shareError);
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;

    try {
      const response = await api.post(`/posts/${id}/comments`, { content: commentText });
      setPost((prev) => ({
        ...prev,
        comments: [response.data, ...(prev.comments || [])],
        commentsCount: prev.commentsCount + 1,
      }));
      setCommentText('');
    } catch (commentError) {
      console.error(commentError);
    }
  };

  if (loading) {
    return <Typography sx={{ mt: 4 }}>Loading post details...</Typography>;
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3, mb: 4 }}>
      <Card sx={{ borderRadius: 3, p: 2 }}>
        <CardHeader
          avatar={(() => {
            const isPlaceholder = post?.user.avatar?.includes('ui-avatars.com');
            const initial = post?.user.name?.[0]?.toUpperCase();
            return (
              <Avatar src={isPlaceholder ? undefined : post?.user.avatar} alt={post?.user.name}>
                {!post?.user.avatar || isPlaceholder ? initial : null}
              </Avatar>
            );
          })()}
          title={post?.user.name}
          subheader={`@${post?.user.username} • ${new Date(post?.createdAt).toLocaleDateString()}`}
          action={
            <Button variant="text" onClick={() => navigate(-1)}>
              Back
            </Button>
          }
        />
        {post?.image && (
          <Box component="img" src={post.image} alt="Post image" sx={{ width: '100%', borderRadius: 3, my: 2 }} />
        )}
        <CardContent>
          <Typography sx={{ whiteSpace: 'pre-line' }}>{post?.content}</Typography>
        </CardContent>
        <Divider />
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={handleLike} color={post?.likedByCurrentUser ? 'error' : 'default'}>
              <FavoriteIcon />
            </IconButton>
            <Typography>{post?.likeCount || 0}</Typography>
            <IconButton onClick={() => document.getElementById('comment-box')?.focus()}>
              <ChatBubbleOutlineIcon />
            </IconButton>
            <Typography>{post?.commentsCount || 0}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={handleShare}>
              <ShareIcon />
            </IconButton>
            <Typography>{post?.shareCount || 0}</Typography>
          </Stack>
        </Stack>
      </Card>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Comments
        </Typography>
        {isAuthenticated ? (
          <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3 }}>
            <TextField
              id="comment-box"
              label="Add a comment"
              multiline
              minRows={3}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              fullWidth
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button type="submit" variant="contained">
                Post comment
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography color="text.secondary">
              Login to add comments or like this post.
            </Typography>
            <Button variant="contained" sx={{ mt: 1 }} onClick={() => navigate('/login')}>
              Login
            </Button>
          </Box>
        )}

        {post?.comments?.length ? (
          <Stack spacing={2}>
            {post.comments.map((comment) => (
              <Card key={comment._id} sx={{ borderRadius: 3, p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  {(() => {
                    const isPlaceholder = comment.user.avatar?.includes('ui-avatars.com');
                    const initial = comment.user.name?.[0]?.toUpperCase();
                    return (
                      <Avatar src={isPlaceholder ? undefined : comment.user.avatar} alt={comment.user.name} sx={{ width: 36, height: 36 }}>
                        {!comment.user.avatar || isPlaceholder ? initial : null}
                      </Avatar>
                    );
                  })()}
                  <Box>
                    <Typography variant="subtitle2">{comment.user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{comment.user.username} • {new Date(comment.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Stack>
                <Typography>{comment.content}</Typography>
              </Card>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">No comments yet. Be the first to share your thoughts.</Typography>
        )}
      </Box>
    </Box>
  );
}

export default PostDetails;
