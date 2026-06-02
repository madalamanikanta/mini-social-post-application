import { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, BottomNavigation, BottomNavigationAction, Paper, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [value, setValue] = useState('/feed');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setValue(location.pathname);
  }, [location.pathname]);

  const profilePath = isAuthenticated ? `/profile/${user.username}` : '/login';
  const profileLabel = isAuthenticated ? 'Profile' : 'Login';

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  if (isMobile) {
    return (
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1300 }} elevation={8}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
            navigate(newValue);
          }}
        >
          <BottomNavigationAction label="Feed" value="/feed" icon={<HomeOutlinedIcon />} />
          <BottomNavigationAction label="Search" value="/search" icon={<SearchOutlinedIcon />} />
          <BottomNavigationAction label={profileLabel} value={profilePath} icon={<AccountCircleOutlinedIcon />} />
        </BottomNavigation>
      </Paper>
    );
  }

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" component={Link} to="/feed" sx={{ color: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Mini Social Post
          </Typography>
          <Button color="inherit" component={Link} to="/feed">
            Feed
          </Button>
        </Box>

        <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, maxWidth: 400 }}>
          <TextField
            size="small"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: 'white',
                },
              },
              '& .MuiOutlinedInput-input::placeholder': {
                opacity: 0.7,
              },
            }}
          />
          <Button type="submit" color="inherit" size="small">
            <SearchOutlinedIcon />
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button color="inherit" component={Link} to={profilePath}>
            {profileLabel}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
