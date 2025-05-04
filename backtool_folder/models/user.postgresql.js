import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool();

class User {
    static async create({ username, email, password }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const { rows } = await pool.query(
            'INSERT INTO users(username, email, password) VALUES($1, $2, $3) RETURNING *',
            [username, email, hashedPassword]
        );
        return rows[0];
    }

    static async findByEmail(email) {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return rows[0];
    }

    static async comparePassword(candidatePassword, hashedPassword) {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }
}

export default User;