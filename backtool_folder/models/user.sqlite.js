import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// Initialize SQLite database connection
async function getDb() {
    return open({
        filename: process.env.SQLITE_DB || './database.sqlite',
        driver: sqlite3.Database,
    });
}

const User = {
    // Create a new user
    async create({ username, email, password }) {
        const db = await getDb();
        const result = await db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, password]
        );
        return { id: result.lastID, username, email, created_at: new Date().toISOString() };
    },

    // Find a user by ID
    async findById(id) {
        const db = await getDb();
        return db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [id]);
    },

    // Find a user by username
    async findByUsername(username) {
        const db = await getDb();
        return db.get('SELECT * FROM users WHERE username = ?', [username]);
    },

    // Find a user by email
    async findByEmail(email) {
        const db = await getDb();
        return db.get('SELECT * FROM users WHERE email = ?', [email]);
    },

    // Update a user
    async update(id, updates) {
        const db = await getDb();
        const allowedUpdates = ['username', 'email', 'password'];
        const fields = Object.keys(updates).filter((key) => allowedUpdates.includes(key));
        if (fields.length === 0) return null;

        const setClause = fields.map((field) => `${field} = ?`).join(', ');
        const values = fields.map((field) => updates[field]).concat(id);

        const result = await db.run(`UPDATE users SET ${setClause} WHERE id = ?`, values);
        if (result.changes === 0) return null;

        return User.findById(id);
    },

    // Delete a user
    async delete(id) {
        const db = await getDb();
        const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
        return result.changes > 0;
    },
};

export default User;