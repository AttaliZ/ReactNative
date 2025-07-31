const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3008;

app.use(cors());

app.get('/api/products', async (req, res) => {
  try {
    const response = await axios.get('http://nindam.sytes.net/std6630202040/Inventory/info.json');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});