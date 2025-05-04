import mysql from 'mysql2/promise';

// Initialize MySQL connection pool
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'myapp',
    port: process.env.MYSQL_PORT || 3306,
});

const User = {
    // Create a new user
    async create({ username, email, password }) {
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, password]
        );
        return { id: result.insertId, username, email, created_at: new Date().toISOString() };
    },

    // Find a user by ID
    async findById(id) {
        const [rows] = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = ?', [id]);
        return rows[0] || null;
    },

    // Find a user by username
    async findByUsername(username) {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0] || null;
    },

    // Find a user by email
    async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    },

    // Update a user
    async update(id, updates) {
        const allowedUpdates = ['username', 'email', 'password'];
        const fields = Object.keys(updates).filter((key) => allowedUpdates.includes(key));
        if (fields.length === 0) return null;

        const setClause = fields.map((field) => `${field} = ?`).join(', ');
        const values = fields.map((field) => updates[field]).concat(id);

        const [result] = await pool.query(`UPDATE users SET ${setClause} WHERE id = ?`, values);
        if (result.affectedRows === 0) return null;

        return User.findById(id);
    },

    // Delete a user
    async delete(id) {
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },
};

export default User;