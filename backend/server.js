
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import rootRouter from './routes/index.js';
import { getStatus } from './controllers/rootController.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for JSON bodies and CORS.
app.use(express.json());
app.use(cors());

// Serve uploaded files (development fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB Atlas using connection helper.
connectDB();

app.get('/', getStatus);
app.use('/api', rootRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the process using this port or set PORT in .env to a different port.`);
  } else {
    console.error('Server startup error:', error);
  }
  process.exit(1);
});
