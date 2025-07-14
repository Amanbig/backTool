import { Database } from 'sqlite';
import bcrypt from 'bcryptjs';

export interface IUser {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: string;
}

class UserModel {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async create(userData: Omit<IUser, 'id' | 'created_at'>): Promise<IUser> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const result = await this.db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [userData.username, userData.email, hashedPassword]
    );

    return this.db.get<IUser>('SELECT * FROM users WHERE id = ?', [result.lastID]);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.db.get<IUser>('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
}

export default UserModel;
