import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { database } from '../config/database';

interface TokenPayload {
  id: string | number;
  email: string;
}

async function loadUserModel() {
  return (await import(`../models/user.${database}`)).default;
}

const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    const User = await loadUserModel();

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Create new user
    const user = await User.create({ username, email, password });

    // Generate token
    const token = generateToken({ 
      id: user._id || user.id, 
      email: user.email 
    });

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const User = await loadUserModel();

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken({ 
      id: user._id || user.id, 
      email: user.email 
    });

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};
