import { User } from '../models/user.mongodb';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
