require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3008;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00"
});


(async function testMySQL(){
  try{
    const conn = await pool.getConnection();
    console.log('Connected to MySQL:', process.env.DB_NAME);
    conn.release();
  }catch(err){
    console.error('MySQL Failed:', err.message);
    process.exit(1);
  }
})();

app.get('/api', (req, res) => {
  res.send('API is running');
});


const JWT_SECRET = process.env.JWT_SECRET;

// Middleware for checking token
function authToken(req,res,next){
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if(!token) return res.status(401).json({ error:'Access Token Required' });
  jwt.verify(token, JWT_SECRET, (err,user)=>{
    if(err) return res.status(403).json({ error:'Invalid Token' });
    req.user = user; 
    next();
  });
}
// Register user
app.post('/api/auth/register', async(req,res)=>{
  try{
    const { username,password,email } = req.body;
    if(!username || !password) return res.status(400).json({error:'Missing body'});
    const [found] = await pool.query('SELECT user_id FROM users WHERE username = ?', [username]);
    if(found.length>0) return res.status(400).json({error:'Username exists'});
    
    const hash = await bcrypt.hash(password,10);
    const [rs] = await pool.query(
      'INSERT INTO users (username, password, email, role) VALUES (?,?,?,?)',
      [username,hash,email,'user']
    );
    res.status(201).json({ success:true, userId: rs.insertId });
  }catch(e){
    console.error('Register Error:',e.message);
    res.status(500).json({error:'Register failed'});
  }
});

// Login user
app.post('/api/auth/login', async(req,res)=>{
  try{
    const {username,password} = req.body;
    if(!username||!password) return res.status(400).json({error:'Missing body'});
    const [u] = await pool.query('SELECT * FROM users WHERE username = ?',[username]);
    if(u.length===0) return res.status(401).json({ error:'Invalid credentials'});
    const match = await bcrypt.compare(password,u[0].password);
    if(!match) return res.status(401).json({ error:'Invalid credentials'});
    const token = jwt.sign(
      { userId:u[0].user_id, username:u[0].username, role:u[0].role},
      JWT_SECRET,{ expiresIn:'24h'}
    );
    res.json({ token, user:{ id:u[0].user_id, username:u[0].username, role:u[0].role }});
  }catch(e){
    console.error('Login Error:',e.message);
    res.status(500).json({ error:'Login failed'});
  }
});

// Protected get products
app.get('/api/products', authToken, async(req,res)=>{
  try{
    const [rows] = await pool.query('SELECT * FROM products ORDER BY lastUpdate DESC');
    res.json(rows);
  }catch(e){
    console.error('Products Error:', e.message);
    res.status(500).json({ error:'Failed to fetch products'});
  }
});

app.listen(port,'0.0.0.0',()=>{
  console.log(`🚀 API running on port ${port}`);
});
