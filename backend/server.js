require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3008;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_.env';

// ---------- Middlewares ----------
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ---------- MySQL Pool ----------
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
});

// quick startup test (non-fatal log if fails)
(async function testMySQL() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL:', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('⚠️  MySQL connection failed on boot:', err.message);
  }
})();

// ---------- Helpers ----------
function authToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access Token Required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid Token' });
    req.user = user;
    next();
  });
}

// ---------- Health / Meta ----------
app.get('/api', (req, res) => {
  res.status(200).json({ ok: true, service: 'myapi', version: '1.0.0' });
});

// Health check
app.get('/api/ping', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      ok: true,
      service: 'myapi',
      time: new Date().toISOString(),
      db: 'up',
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      service: 'myapi',
      time: new Date().toISOString(),
      db: 'down',
      error: e.message,
    });
  }
});

// ---------- Auth ----------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Missing body' });

    const [found] = await pool.query(
      'SELECT user_id FROM users WHERE username = ?',
      [username]
    );
    if (found.length > 0)
      return res.status(400).json({ error: 'Username exists' });

    const hash = await bcrypt.hash(password, 10);
    const [rs] = await pool.query(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, hash, email || null, 'user']
    );
    return res.status(201).json({ success: true, userId: rs.insertId });
  } catch (e) {
    console.error('Register Error:', e);
    return res.status(500).json({ error: 'Register failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Missing body' });

    const [u] = await pool.query(
      'SELECT user_id, username, password, role FROM users WHERE username = ?',
      [username]
    );
    if (u.length === 0)
      return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, u[0].password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: u[0].user_id, username: u[0].username, role: u[0].role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: u[0].user_id,
        username: u[0].username,
        role: u[0].role,
      },
    });
  } catch (e) {
    console.error('Login Error:', e);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// ---------- Products CRUD (Enhanced) ----------

// GET /api/products (fetch all products)
app.get('/api/products', authToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM products ORDER BY lastUpdate DESC'
    );
    return res.json(rows);
  } catch (e) {
    console.error('Products Error:', e);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id (fetch single product)
app.get('/api/products/:id', authToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(rows[0]);
  } catch (e) {
    console.error('Product Fetch Error:', e);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products
app.post('/api/products', authToken, async (req, res) => {
  try {
    const {
      name, stock, category, location, image, status, brand, sizes, productCode, orderName
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [rs] = await pool.query(
      `INSERT INTO products
      (name, stock, category, location, image, status, brand, sizes, productCode, orderName, lastUpdate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name, stock || 0, category || null, location || null,
        image || null, status || 'Active', brand || null, sizes || null, productCode || null,
        orderName || null
      ]
    );
    return res.status(201).json({ success: true, productId: rs.insertId });
  } catch (e) {
    console.error('Create Product Error:', e);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id
app.put('/api/products/:id', authToken, async (req, res) => {
  console.log('Received body:', req.body);
  try {
    const { id } = req.params;
    const { name, stock, status, category, location, image, brand, sizes, productCode, orderName } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [found] = await pool.query(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );
    if (found.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await pool.query(
      `UPDATE products SET name = ?, stock = ?, status = ?, category = ?, location = ?, image = ?, brand = ?, sizes = ?, productCode = ?, orderName = ?, lastUpdate = NOW() WHERE id = ?`,
      [
        name, stock || 0, status || 'Active', category || null, location || null,
        image || null, brand || null, sizes || null, productCode || null, orderName || null, id
      ]
    );
    return res.json({ success: true, productId: id });
  } catch (e) {
    console.error('Update Product Error:', {
      message: e.message,
      stack: e.stack,
      params: req.params,
      body: req.body,
      time: new Date().toISOString(),
    });
    return res.status(500).json({ error: 'Failed to update product', details: e.message });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', authToken, async (req, res) => {
  console.log('Delete request for id:', req.params.id);
  try {
    const { id } = req.params;
    const [found] = await pool.query(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );
    if (found.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    console.log('Attempting to delete product with id:', id);
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return res.json({ success: true, productId: id });
  } catch (e) {
    console.error('Delete Product Error:', {
      message: e.message,
      stack: e.stack,
      params: req.params,
      time: new Date().toISOString(),
    });
    return res.status(500).json({ error: 'Failed to delete product', details: e.message });
  }
});

// ---------- Global Error Guard ----------
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  return res.status(500).json({ error: 'Internal Server Error' });
});

// ---------- Start Server ----------
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API running on port ${PORT}`);
});

// Graceful shutdown (PM2 friendly)
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
async function shutdown() {
  try {
    console.log('Shutting down gracefully...');
    await pool.end();
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    // force exit after 5s
    setTimeout(() => process.exit(0), 5000).unref();
  } catch (e) {
    console.error('Shutdown error:', e);
    process.exit(1);
  }
}