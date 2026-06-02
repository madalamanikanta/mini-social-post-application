import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Card,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import api from '../services/api';

function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await api.get('/users/search', { params: { q: query } });
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      performSearch(query);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };

  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Card sx={{ display: { xs: 'block', sm: 'none' }, borderRadius: 3, p: 2, boxShadow: 3 }}>
        <TextField
          fullWidth
          label="Search users by name or username"
          placeholder="Type at least 2 characters..."
          value={searchQuery}
          onChange={handleSearchChange}
          autoFocus
        />
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : hasSearched && results.length === 0 ? (
        <Card sx={{ borderRadius: 3, p: 3, boxShadow: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No users found</Typography>
          <Typography color="text.secondary">Try a different search.</Typography>
        </Card>
      ) : (
        <Grid
        container
        spacing={2}
        alignItems="stretch"
        justifyContent="center"
        sx={{
            mt: 2,
            mx: 0,
            width: '100%',
        }}
        >
          {results.map((user) => (
            <Grid
            key={user._id}
            item
            xs={12}
            md={6}
            xl={4}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                px: { xs: 1, sm: 0 },
            }}
            >
              <Card
                onClick={() => handleUserClick(user.username)}
                sx={{
                  width: '100%',
                maxWidth: {
                xs: 360,
                sm: '100%',
                },
                mx: 'auto',
                  borderRadius: 3,
                  p: 3,
                  boxShadow: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
                  <Avatar
                    src={user.avatar?.includes('ui-avatars.com') ? undefined : user.avatar}
                    alt={user.name}
                    sx={{ width: 80, height: 80 }}
                  >
                    {!user.avatar || user.avatar?.includes('ui-avatars.com')
                      ? user.name?.[0]?.toUpperCase()
                      : null}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{user.name}</Typography>
                    <Typography color="text.secondary">@{user.username}</Typography>
                  </Box>
                  {user.bio && (
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                      {user.bio}
                    </Typography>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                  {user.postsCount} {user.postsCount === 1 ? 'post' : 'posts'}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}

export default Search;
