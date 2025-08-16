const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt'); // สำหรับ hash password
const jwt = require('jsonwebtoken'); // สำหรับ JWT token

const app = express();
const port = 3008;

app.use(cors());
app.use(express.json()); // สำหรับ parse JSON body

const JWT_SECRET = 'your-secret-key'; // ใน production ควรเก็บใน environment variable

const pool = mysql.createPool({
  host: 'nindam.sytes.net',
  user: 'std6630202040',
  password: 's8*RgL1Z',
  database: 'it_std6630202040',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware สำหรับตรวจสอบ JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// AUTH ROUTES //

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // ตรวจสอบว่า username ซ้ำหรือไม่
    const [existingUser] = await pool.query(
      'SELECT user_id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email || null, 'user']
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // หาผู้ใช้ในฐานข้อมูล
    const [users] = await pool.query(
      'SELECT user_id, username, password, email, role FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    // ตรวจสอบ password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // สร้าง JWT token
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        username: user.username,
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// PRODUCTS ROUTES //

// Get all products (protected)
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        name,
        stock,
        category,
        location,
        image,
        status,
        brand,
        sizes,
        productCode,
        orderName,
        lastUpdate
      FROM products 
      ORDER BY lastUpdate DESC
    `);

    // แปลงข้อมูลให้ตรงกับ format ที่ frontend ต้องการ
    const products = rows.map(product => ({
      id: product.id.toString(),
      name: product.name,
      stock: product.stock,
      category: product.category,
      location: product.location,
      image: product.image || 'https://via.placeholder.com/200x200?text=No+Image',
      status: product.status === 'Active' ? 'Active' : 'Inactive',
      brand: product.brand,
      sizes: product.sizes,
      productCode: product.productCode,
      orderName: product.orderName,
      storeAvailability: [
        { location: 'Manchester, UK', available: Math.random() > 0.5 },
        { location: 'Yorkshire, UK', available: Math.random() > 0.5 },
        { location: 'Hull, UK', available: Math.random() > 0.5 },
        { location: 'Leicester, UK', available: Math.random() > 0.5 }
      ],
      lastUpdate: product.lastUpdate ? new Date(product.lastUpdate).toLocaleDateString() : 'N/A'
    }));

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product (protected)
app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = rows[0];
    res.json({
      id: product.id.toString(),
      name: product.name,
      stock: product.stock,
      category: product.category,
      location: product.location,
      image: product.image || 'https://via.placeholder.com/200x200?text=No+Image',
      status: product.status,
      brand: product.brand,
      sizes: product.sizes,
      productCode: product.productCode,
      orderName: product.orderName,
      storeAvailability: [
        { location: 'Manchester, UK', available: Math.random() > 0.5 },
        { location: 'Yorkshire, UK', available: Math.random() > 0.5 },
        { location: 'Hull, UK', available: Math.random() > 0.5 },
        { location: 'Leicester, UK', available: Math.random() > 0.5 }
      ],
      lastUpdate: product.lastUpdate ? new Date(product.lastUpdate).toLocaleDateString() : 'N/A'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Add new product (protected)
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      stock,
      category,
      location,
      image,
      status,
      brand,
      sizes,
      productCode,
      orderName
    } = req.body;

    const [result] = await pool.query(`
      INSERT INTO products 
      (name, stock, category, location, image, status, brand, sizes, productCode, orderName, lastUpdate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [name, stock, category, location, image, status, brand, sizes, productCode, orderName]);

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      productId: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update product (protected)
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      stock,
      category,
      location,
      image,
      status,
      brand,
      sizes,
      productCode,
      orderName
    } = req.body;

    const [result] = await pool.query(`
      UPDATE products 
      SET name = ?, stock = ?, category = ?, location = ?, image = ?, 
          status = ?, brand = ?, sizes = ?, productCode = ?, orderName = ?, 
          lastUpdate = NOW()
      WHERE id = ?
    `, [name, stock, category, location, image, status, brand, sizes, productCode, orderName, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product updated successfully'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (protected)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// USERS ROUTES (for admin) //

// Get all users (admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // ตรวจสอบว่าเป็น admin หรือไม่
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [rows] = await pool.query(`
      SELECT user_id, username, email, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get current user profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, username, email, role, created_at FROM users WHERE user_id = ?',
      [req.user.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('POST /api/auth/register - Register new user');
  console.log('POST /api/auth/login - User login');
  console.log('GET /api/auth/verify - Verify token');
  console.log('GET /api/products - Get all products (protected)');
  console.log('GET /api/products/:id - Get single product (protected)');
  console.log('POST /api/products - Add new product (protected)');
  console.log('PUT /api/products/:id - Update product (protected)');
  console.log('DELETE /api/products/:id - Delete product (protected)');
  console.log('GET /api/users - Get all users (admin only)');
  console.log('GET /api/users/profile - Get current user profile (protected)');
});