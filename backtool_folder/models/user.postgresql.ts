import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export interface IUser {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: Date;
}

class UserModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(userData: Omit<IUser, 'id' | 'created_at'>): Promise<IUser> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const result = await this.pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
      [userData.username, userData.email, hashedPassword]
    );
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
}

export default UserModel;
