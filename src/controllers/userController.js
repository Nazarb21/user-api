const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config');

const registerUser = async (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName.match(/^[A-Za-z]+$/) || !lastName.match(/^[A-Za-z]+$/)) {
        return res.status(400).send('First name and last name must contain only letters.');
    }

    try {
        const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).send('Email already exists.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (first_name, last_name, email, phone, password) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [firstName, lastName, email, phone, hashedPassword]
        );

        const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { registerUser };

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).send('Invalid credentials.');
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { registerUser, loginUser };

const getUser = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).send('User not found.');
        }

        res.json(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { registerUser, loginUser, getUser };

const updateUser = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (updates.firstName && !updates.firstName.match(/^[A-Za-z]+$/)) {
        return res.status(400).send('First name must contain only letters.');
    }
    if (updates.lastName && !updates.lastName.match(/^[A-Za-z]+$/)) {
        return res.status(400).send('Last name must contain only letters.');
    }

    try {
        if (updates.email) {
            const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [updates.email]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).send('Email already exists.');
            }
        }

        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        const result = await pool.query(
            `UPDATE users SET 
      first_name = COALESCE($1, first_name), 
      last_name = COALESCE($2, last_name), 
      email = COALESCE($3, email), 
      phone = COALESCE($4, phone), 
      password = COALESCE($5, password) 
      WHERE id = $6 RETURNING *`,
            [updates.firstName, updates.lastName, updates.email, updates.phone, updates.password, id]
        );

        io.emit('userUpdated', result.rows[0]); // Надсилаємо push-повідомлення
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { registerUser, loginUser, getUser, updateUser };
