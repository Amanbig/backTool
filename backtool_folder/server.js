import express from 'express';
import './config/database.js';

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to your backend!' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});