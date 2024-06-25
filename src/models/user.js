const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const createUser = async (firstName, lastName, email, phone, password) => {
    const result = await pool.query(
        'INSERT INTO users (first_name, last_name, email, phone, password) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [firstName, lastName, email, phone, password]
    );
    return result.rows[0];
};

const getUserById = async (id) => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
};

const getUserByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

const updateUser = async (id, updates) => {
    const { firstName, lastName, email, phone, password } = updates;
    const result = await pool.query(
        `UPDATE users SET 
    first_name = COALESCE($1, first_name), 
    last_name = COALESCE($2, last_name), 
    email = COALESCE($3, email), 
    phone = COALESCE($4, phone), 
    password = COALESCE($5, password) 
    WHERE id = $6 RETURNING *`,
        [firstName, lastName, email, phone, password, id]
    );
    return result.rows[0];
};

module.exports = { createUser, getUserById, getUserByEmail, updateUser };
