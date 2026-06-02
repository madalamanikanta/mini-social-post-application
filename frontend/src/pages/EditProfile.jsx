import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

function EditProfile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview !== user?.avatar) {
        try {
          URL.revokeObjectURL(avatarPreview);
        } catch {}
      }
    };
  }, [avatarPreview, user?.avatar]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const updatedUser = await updateProfile(formData);
      setAvatarPreview(updatedUser.avatar || avatarPreview);
      navigate(`/profile/${user.username}`);
    } catch (submitError) {
      const serverMessage = submitError.response?.data?.error;
      if (avatarFile && serverMessage) {
        // Show cloudinary/server error only when an avatar upload was attempted
        setError(serverMessage);
      } else {
        setError('Unable to update profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container justifyContent="center" sx={{ mt: 4, mb: 4 }}>
      <Grid item xs={12} sm={10} md={8}>
        <Card sx={{ p: 2, borderRadius: 3 }}>
          <CardHeader title="Edit Profile" />
          <CardContent>
            <Stack spacing={3} component="form" onSubmit={handleSubmit}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                {(() => {
                  const isPlaceholder = avatarPreview?.includes('ui-avatars.com');
                  const initial = user?.name?.[0]?.toUpperCase();
                  return (
                    <Avatar src={isPlaceholder ? undefined : avatarPreview} alt={user?.name} sx={{ width: 80, height: 80 }}>
                      {!avatarPreview || isPlaceholder ? initial : null}
                    </Avatar>
                  );
                })()}
                <Box>
                  <Typography variant="subtitle1">@{user?.username}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    
                  </Typography>
                </Box>
              </Stack>
              <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} fullWidth />
              <TextField
                label="Bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                multiline
                minRows={3}
                fullWidth
              />
              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
              <Stack direction="row" justifyContent="space-between">
                <Button variant="outlined" onClick={() => navigate(`/profile/${user.username}`)}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default EditProfile;
