import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import api, { followUser, unfollowUser, getFollowers, getFollowing } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

function Profile() {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);
  const [followers, setFollowers] = useState([]);
    const [followLoading, setFollowLoading] = useState(false);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const [profileData, postsData] = await Promise.all([
        api.get(`/users/${username}`),
        api.get('/posts', { params: { username } }),
      ]);

      setProfile(profileData.data);
      setPosts(postsData.data);
      setIsFollowing(profileData.data.isFollowing || false);
    } catch (profileError) {
      setError(profileError.response?.data?.error || 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const isOwner = isAuthenticated && currentUser?.username === username;

  const handleLogout = async () => {
    await logout();
    navigate('/feed');
  };

  const handleDeleteAccountClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteAccountConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await api.delete('/users/me');
      // Clear auth and redirect
      localStorage.removeItem('miniSocialAuth');
      navigate('/feed');
    } catch (deleteError) {
      setError(deleteError.response?.data?.error || 'Unable to delete account.');
    }
  };

  const handleDeleteAccountCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleFollowClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    try {
      await followUser(username);
      setIsFollowing(true);
      setProfile((prev) => ({
        ...prev,
        followersCount: (prev.followersCount || 0) + 1,
      }));
    } catch (followError) {
      setError(followError.response?.data?.error || 'Unable to follow user.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollowClick = async () => {
    setFollowLoading(true);
    try {
      await unfollowUser(username);
      setIsFollowing(false);
      setProfile((prev) => ({
        ...prev,
        followersCount: Math.max(0, (prev.followersCount || 1) - 1),
      }));
    } catch (unfollowError) {
      setError(unfollowError.response?.data?.error || 'Unable to unfollow user.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenFollowersDialog = async () => {
    try {
      const response = await getFollowers(username);
      setFollowers(response.data);
      setFollowersDialogOpen(true);
    } catch (error) {
      console.error('Failed to load followers:', error);
    }
  };

  const handleOpenFollowingDialog = async () => {
    try {
      const response = await getFollowing(username);
      setFollowing(response.data);
      setFollowingDialogOpen(true);
    } catch (error) {
      console.error('Failed to load following:', error);
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
    <>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, p: 3, height: 'fit-content' }}>
            <Stack spacing={2} alignItems="center" textAlign="center">
              {(() => {
                const isPlaceholder = profile?.avatar?.includes('ui-avatars.com');
                const initial = profile?.name?.[0]?.toUpperCase();
                return (
                  <Avatar src={isPlaceholder ? undefined : profile?.avatar} alt={profile?.name} sx={{ width: 100, height: 100 }}>
                    {!profile?.avatar || isPlaceholder ? initial : null}
                  </Avatar>
                );
              })()}
              <Box>
                <Typography variant="h5">{profile?.name}</Typography>
                <Typography color="text.secondary">@{profile?.username}</Typography>
              </Box>

              {!isOwner && isAuthenticated && (
                isFollowing ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleUnfollowClick}
                    sx={{ mt: 1 }}
                    disabled={followLoading}
                  >
                    {followLoading ? <CircularProgress size={18} /> : 'Unfollow'}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleFollowClick}
                    sx={{ mt: 1 }}
                    disabled={followLoading}
                  >
                    {followLoading ? <CircularProgress size={18} /> : 'Follow'}
                  </Button>
                )
              )}

              {isOwner && (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleLogout}
                    sx={{ mt: 1 }}
                  >
                    Logout
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    onClick={handleDeleteAccountClick}
                    size="small"
                  >
                    Delete Account
                  </Button>
                </>
              )}

              {profile?.bio && (
                <>
                  <Divider sx={{ width: '100%' }} />
                  <Typography>{profile.bio}</Typography>
                </>
              )}

              <Divider sx={{ width: '100%' }} />
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ width: '100%' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={handleOpenFollowersDialog}
                  sx={{ textTransform: 'none' }}
                >
                  <Stack alignItems="center">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {profile?.followersCount || 0}
                    </Typography>
                    <Typography variant="caption">Followers</Typography>
                  </Stack>
                </Button>
                <Divider orientation="vertical" flexItem />
                <Button
                  variant="text"
                  size="small"
                  onClick={handleOpenFollowingDialog}
                  sx={{ textTransform: 'none' }}
                >
                  <Stack alignItems="center">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {profile?.followingCount || 0}
                    </Typography>
                    <Typography variant="caption">Following</Typography>
                  </Stack>
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isOwner ? 'Your Posts' : `${profile?.name}'s Posts`}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {posts.length ? (
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
              <Typography color="text.secondary">No posts found for this user.</Typography>
            )}
          </Card>
        </Grid>
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteAccountCancel}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            This action cannot be undone. All posts and profile data will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteAccountCancel}>Cancel</Button>
          <Button onClick={handleDeleteAccountConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={followersDialogOpen} onClose={() => setFollowersDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Followers</DialogTitle>
        <DialogContent>
          {followers.length > 0 ? (
            <List>
              {followers.map((follower) => (
                <ListItem key={follower._id}>
                  <ListItemAvatar>
                    <Avatar src={follower.avatar} alt={follower.name} />
                  </ListItemAvatar>
                  <ListItemText primary={follower.name} secondary={`@${follower.username}`} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No followers yet.</Typography>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={followingDialogOpen} onClose={() => setFollowingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Following</DialogTitle>
        <DialogContent>
          {following.length > 0 ? (
            <List>
              {following.map((followedUser) => (
                <ListItem key={followedUser._id}>
                  <ListItemAvatar>
                    <Avatar src={followedUser.avatar} alt={followedUser.name} />
                  </ListItemAvatar>
                  <ListItemText primary={followedUser.name} secondary={`@${followedUser.username}`} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>Not following anyone yet.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Profile;
