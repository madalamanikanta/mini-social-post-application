import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/feed';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (submitError) {
      setError(submitError.response?.data?.error || 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await googleSignIn();
      navigate('/feed');
    } catch (googleError) {
      setError(googleError.response?.data?.error || 'Unable to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
      <Paper sx={{ width: '100%', maxWidth: 520, p: 4, borderRadius: 3 }} elevation={3}>
        <Stack spacing={3}>
          <Typography variant="h4">Login</Typography>
          <TextField
            type="email"
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            fullWidth
          />
          <TextField
            type="password"
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" fullWidth onClick={handleSubmit} disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<GoogleIcon />}
              fullWidth
              onClick={handleGoogle}
              disabled={loading}
            >
              Continue with Google
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Don’t have an account?{' '}
            <Button component={Link} to="/signup" sx={{ p: 0, textTransform: 'none' }}>
              Create one here.
            </Button>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}

export default Login;
