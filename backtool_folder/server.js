import express from 'express';
import './config/database.js';
import authRouter from './routes/auth.js';
import authMiddleware from './middleware/auth.js';
import cors from 'cors';

const app = express();
app.use(express.json());

app.use(cors());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to your backend!' });
});

app.use('/auth', authRouter);

app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});