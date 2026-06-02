import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../context/AuthContext';

function Signup() {
  const { signup, googleSignIn } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      await signup({
        name,
        email,
        password,
      });

      navigate('/feed');
    } catch (submitError) {
      setError(
        submitError.response?.data?.error ||
        'Unable to sign up.'
      );
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
      setError(
        googleError.response?.data?.error ||
        'Unable to continue with Google.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        mt: 4,
        mb: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 520,
          p: 4,
          borderRadius: 3,
        }}
      >
        <Stack
          spacing={3}
          component="form"
          onSubmit={handleSubmit}
        >
          <Typography variant="h4">
            Create your account
          </Typography>

          <TextField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
            required
          />

          <TextField
            type="email"
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            fullWidth
            required
          />

          <TextField
            type="password"
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
            required
          />

          {error && (
            <Typography
              color="error"
              variant="body2"
            >
              {error}
            </Typography>
          )}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
          >
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Signup'}
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

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Already have an account?{' '}
            <Button
              component={Link}
              to="/login"
              sx={{
                p: 0,
                minWidth: 'auto',
                textTransform: 'none',
              }}
            >
              Login here.
            </Button>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}

export default Signup;