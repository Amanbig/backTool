import { Pool, RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export interface IUser extends RowDataPacket {
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

    const [result] = await this.pool.query<IUser[]>(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [userData.username, userData.email, hashedPassword]
    );

    const [newUser] = await this.pool.query<IUser[]>(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    );
    return newUser[0];
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const [rows] = await this.pool.query<IUser[]>('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
}

export default UserModel;
