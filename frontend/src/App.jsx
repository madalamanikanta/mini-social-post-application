import { Container } from '@mui/material';
import Navbar from './components/Navbar';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context';
import { AppBar, Toolbar, Typography } from '@mui/material';

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, pb: { xs: 12, md: 4 } }}>
        <>
      <AppBar position="sticky" elevation={1} sx={{ display: { xs: 'block', sm: 'none' } }}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Mini Social Post
          </Typography>
        </Toolbar>
      </AppBar>

      <AppRoutes />
    </>
      </Container>
    </AuthProvider>
  );
}

export default App;