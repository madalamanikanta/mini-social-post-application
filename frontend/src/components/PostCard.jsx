import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function PostCard({ post, onLike, onUpdate, onDelete }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [localPost, setLocalPost] = useState(post);
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentError, setCommentError] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentsCount || 0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [newImageFile, setNewImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(post.image || '');
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    setCommentCount(localPost.commentsCount || 0);
  }, [localPost.commentsCount]);

  useEffect(() => {
    setEditContent(localPost.content || '');
    setImagePreviewUrl(localPost.image || '');
    setNewImageFile(null);
    setRemoveImage(false);
  }, [editDialogOpen, localPost.content, localPost.image]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const isOwner = isAuthenticated && user?.username === localPost.user?.username;

  const handleLike = async () => {
    if (onLike) {
      onLike(localPost._id);
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const optimisticPost = {
      ...localPost,
      likedByCurrentUser: !localPost.likedByCurrentUser,
      likeCount: Math.max(0, localPost.likeCount + (localPost.likedByCurrentUser ? -1 : 1)),
    };
    setLocalPost(optimisticPost);

    try {
      const response = await api.patch(`/posts/${localPost._id}/like`);
      setLocalPost((prev) => ({
        ...prev,
        likeCount: response.data.likeCount,
        likedByCurrentUser: response.data.likedByCurrentUser,
      }));
      onUpdate?.({
        ...localPost,
        likeCount: response.data.likeCount,
        likedByCurrentUser: response.data.likedByCurrentUser,
      });
    } catch (error) {
      console.error('Like toggle failed:', error);
      setLocalPost(post);
    }
  };

  const handleToggleComments = async () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    if (commentsLoaded || !nextExpanded) {
      return;
    }

    setLoadingComments(true);
    setCommentError('');

    try {
      const response = await api.get(`/posts/${localPost._id}/comments`);
      setComments(response.data);
      setCommentsLoaded(true);
      setCommentCount(response.data.length);
    } catch (error) {
      setCommentError(error.response?.data?.error || 'Unable to load comments.');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    setCommentError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!commentInput.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }

    if (commentInput.length > 500) {
      setCommentError('Comment cannot exceed 500 characters.');
      return;
    }

    setPostingComment(true);
    try {
      const response = await api.post(`/posts/${localPost._id}/comments`, { text: commentInput.trim() });
      setComments((prev) => [response.data, ...prev]);
      setCommentCount((prev) => prev + 1);
      setCommentInput('');
      setCommentsLoaded(true);
      if (!expanded) {
        setExpanded(true);
      }
      const updatedPost = { ...localPost, commentsCount: commentCount + 1 };
      setLocalPost(updatedPost);
      onUpdate?.(updatedPost);
    } catch (error) {
      setCommentError(error.response?.data?.error || 'Unable to post comment.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditOpen = () => {
    handleMenuClose();
    setEditDialogOpen(true);
  };

  const handleDeleteOpen = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (imagePreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setNewImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setNewImageFile(null);
    setImagePreviewUrl('');
    if (localPost.image) {
      setRemoveImage(true);
    }
  };

  const handleSaveEdit = async () => {
    setEditError('');
    const trimmedContent = editContent.trim();

    if (!trimmedContent && !newImageFile && (!localPost.image || removeImage)) {
      setEditError('Post must include text or an image.');
      return;
    }

    setEditLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', trimmedContent);
      if (newImageFile) {
        formData.append('image', newImageFile);
      }
      if (removeImage && !newImageFile) {
        formData.append('removeImage', 'true');
      }

      const response = await api.put(`/posts/${localPost._id}`, formData);
      setLocalPost(response.data);
      onUpdate?.(response.data);
      setEditDialogOpen(false);
    } catch (error) {
      setEditError(error.response?.data?.error || 'Unable to save post.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await api.delete(`/posts/${localPost._id}`);
      onDelete?.(localPost._id);
    } catch (error) {
      console.error('Delete post failed:', error);
    }
  };

  const visibleComments = [...comments].reverse();

  return (
    <Card sx={{ mb: 3, borderRadius: 4, boxShadow: 3 }}>
      <CardHeader
        avatar={
          (() => {
            const isPlaceholder = localPost.user.avatar?.includes('ui-avatars.com');
            const initial = localPost.user.name?.[0]?.toUpperCase();
            return (
              <Avatar
                src={isPlaceholder ? undefined : localPost.user.avatar}
                alt={localPost.user.name}
                sx={{ width: 48, height: 48 }}
              >
                {!localPost.user.avatar || isPlaceholder ? initial : null}
              </Avatar>
            );
          })()
        }
        action={
          isOwner && (
            <>
              <IconButton onClick={handleMenuOpen} aria-label="post options">
                <MoreVertIcon />
              </IconButton>
              <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleEditOpen}>
                  <EditIcon fontSize="small" sx={{ mr: 1 }} />
                  Edit Post
                </MenuItem>
                <MenuItem onClick={handleDeleteOpen}>
                  <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                  Delete Post
                </MenuItem>
              </Menu>
            </>
          )
        }
        title={<Typography variant="subtitle1">{localPost.user.name}</Typography>}
        subheader={
          <Typography variant="body2" color="text.secondary">
            @{localPost.user.username} • {new Date(localPost.createdAt).toLocaleDateString()}
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0, px: 3, pb: 3 }}>
        {localPost.content && (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: localPost.image ? 2 : 0 }}>
            {localPost.content}
          </Typography>
        )}
        {localPost.image && (
          <Box
            component="img"
            
            src={
              localPost.image.startsWith('http')
                ? localPost.image
                : `https://mini-social-post-application-ug33.onrender.com${localPost.image}`
            }
            alt={`${localPost.user.name} post image`}
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: 700,
              objectFit: 'contain',
              borderRadius: 3,
              display: 'block',
              mx: 'auto',
            }}
          />
        )}
      </CardContent>
      {onLike && (
        <CardActions disableSpacing sx={{ px: 3, pb: 2, pt: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={handleLike} color={localPost.likedByCurrentUser ? 'error' : 'default'} aria-label="like">
              <FavoriteIcon />
            </IconButton>
            <Typography variant="body2">{localPost.likeCount || 0}</Typography>
            <IconButton onClick={handleToggleComments} color={expanded ? 'primary' : 'default'} aria-label="toggle comments">
              <ChatBubbleOutlineIcon />
            </IconButton>
            <Typography variant="body2">{commentCount || 0}</Typography>
          </Stack>
        </CardActions>
      )}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider sx={{ mx: 3 }} />
        <Box sx={{ px: 3, pb: 3, pt: 2 }}>
          {loadingComments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : visibleComments.length ? (
            <Stack spacing={2}>
              {visibleComments.map((comment) => (
                <Box key={comment._id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Avatar
                    src={comment.avatar?.includes('ui-avatars.com') ? undefined : comment.avatar}
                    alt={comment.name}
                    sx={{ width: 36, height: 36, mt: '2px' }}
                  >
                    {!comment.avatar || comment.avatar?.includes('ui-avatars.com')
                      ? comment.name?.[0]?.toUpperCase()
                      : null}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2">
                      <Typography component="span" variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {comment.name}
                      </Typography>{' '}
                      <Typography component="span" color="text.secondary">
                        @{comment.username}
                      </Typography>
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 0.5 }}>
                      {comment.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">No comments yet.</Typography>
              <Typography variant="caption" color="text.secondary">Be the first to share your thoughts.</Typography>
            </Box>
          )}

          <Box component="form" onSubmit={handleCommentSubmit} sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
            <TextField
              size="small"
              placeholder="Add a comment..."
              fullWidth
              value={commentInput}
              onChange={(event) => setCommentInput(event.target.value)}
              disabled={postingComment}
              inputProps={{ maxLength: 500 }}
            />
            <IconButton type="submit" color="primary" disabled={postingComment || !commentInput.trim()} aria-label="send comment">
              <SendIcon />
            </IconButton>
          </Box>
          {commentError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {commentError}
            </Typography>
          )}
        </Box>
      </Collapse>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Post</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Post content"
              multiline
              minRows={3}
              fullWidth
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
            />
            <input
              ref={fileInputRef}
              hidden
              accept="image/*"
              type="file"
              onChange={handleImageFileChange}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<AddPhotoAlternateIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Replace image
              </Button>
              {imagePreviewUrl && (
                <Button
                  variant="text"
                  color="error"
                  startIcon={<RemoveCircleOutlineIcon />}
                  onClick={handleRemoveImage}
                >
                  Remove image
                </Button>
              )}
            </Stack>
            {imagePreviewUrl ? (
              <Box
                component="img"
                src={imagePreviewUrl}
                alt="Image preview"
                sx={{ width: '100%', height: 'auto', maxHeight: 360, objectFit: 'contain', borderRadius: 3 }}
              />
            ) : null}
            {editError && (
              <Typography color="error" variant="body2">
                {editError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={editLoading}>
            {editLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <Typography>This post will be permanently deleted. Are you sure?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default PostCard;
