import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

import db from './src/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[SERVER LOG] Request received: ${req.method} ${req.url}`);
  next();
});

app.get('/api/products', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, name, purchase_price, selling_price, category, image FROM products');
    const items = stmt.all();
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  console.log(`[SERVER LOG] Received DELETE request for user ID: ${req.params.id}`);
  try {
    const id = req.params.id;

    // Safeguard: Prevent deleting the main admin user
    const userStmt = db.prepare('SELECT username FROM users WHERE id = ?');
    const user = userStmt.get(id) as { username: string } | undefined;
    if (user && user.username === 'admin') {
      return res.status(403).json({ error: 'Cannot delete the admin user.' });
    }

    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes > 0) {
      res.status(200).json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/users', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, username, role FROM users');
    const users = stmt.all();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/register', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // In a real app, you should hash the password before storing it.
    // For this simple example, we'll store it as plain text.
    const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    const info = stmt.run(username, password, 'cashier');

    res.status(201).json({ id: info.lastInsertRowid, username, role: 'cashier' });

  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: 'Username already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/sales/summary', (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = '';
    const params = [];

    if (startDate) {
      whereClause += ' WHERE s.sale_date >= ?';
      params.push(startDate + ' 00:00:00');
    }

    if (endDate) {
      whereClause += startDate ? ' AND s.sale_date <= ?' : ' WHERE s.sale_date <= ?';
      params.push(endDate + ' 23:59:59');
    }

    const query = `
      SELECT
        SUM(si.selling_price * si.quantity) as totalRevenue,
        SUM(si.purchase_price * si.quantity) as totalCost
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      ${whereClause}
    `;

    const stmt = db.prepare(query);
    const result = stmt.get(...params) as { totalRevenue: number | null, totalCost: number | null };

    const totalRevenue = result.totalRevenue || 0;
    const totalCost = result.totalCost || 0;
    const totalProfit = totalRevenue - totalCost;

    res.json({
      totalRevenue,
      totalCost,
      totalProfit
    });

  } catch (error) {
    console.error('Failed to get sales summary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/sales', (req, res) => {
  const { total, items } = req.body;

  if (!total || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid sales data' });
  }

  const recordSale = db.transaction(() => {
    // 1. Create a new sale record
    const saleStmt = db.prepare('INSERT INTO sales (total_amount) VALUES (?)');
    const saleInfo = saleStmt.run(total);
    const saleId = saleInfo.lastInsertRowid;

    // 2. For each item in the cart, get its purchase_price and insert into sale_items
    const itemStmt = db.prepare('INSERT INTO sale_items (sale_id, product_id, quantity, purchase_price, selling_price) VALUES (?, ?, ?, ?, ?)');
    const getProductPriceStmt = db.prepare('SELECT purchase_price FROM products WHERE id = ?');

    for (const item of items) {
      const product = getProductPriceStmt.get(item.id) as { purchase_price: number } | undefined;
      if (product) {
        itemStmt.run(saleId, item.id, item.quantity, product.purchase_price, item.selling_price);
      } else {
        // If product not found, throw an error to rollback the transaction
        throw new Error(`Product with ID ${item.id} not found.`);
      }
    }
    return saleId;
  });

  try {
    const saleId = recordSale();
    res.status(201).json({ success: true, saleId });
  } catch (error: any) {
    console.error('Transaction failed:', error.message);
    res.status(500).json({ error: 'Failed to record sale', details: error.message });
  }
});

app.post('/api/products/bulk', (req, res) => {
  const products = req.body.products;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Invalid products data' });
  }

  const insertMany = db.transaction((prods) => {
    const stmt = db.prepare('INSERT INTO products (name, purchase_price, selling_price, category, image) VALUES (?, ?, ?, ?, ?)');
    for (const p of prods) {
      // Basic validation
      if (p.name && p.purchase_price && p.selling_price && p.category) {
        stmt.run(p.name, p.purchase_price, p.selling_price, p.category, null);
      } else {
        // You could add more specific error handling here
        console.warn('Skipping invalid product row:', p);
      }
    }
  });

  try {
    insertMany(products);
    res.status(201).json({ success: true, message: `${products.length} products imported.` });
  } catch (error: any) {
    console.error('Bulk insert failed:', error.message);
    res.status(500).json({ error: 'Failed to import products', details: error.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { name, purchase_price, selling_price, category, image } = req.body;
    if (!name || !purchase_price || !selling_price || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare('INSERT INTO products (name, purchase_price, selling_price, category, image) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, purchase_price, selling_price, category, image || null);
    
    res.status(201).json({ id: info.lastInsertRowid, ...req.body });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

  // API routes will go here
  app.post('/api/login', (req, res) => {
    try {
      const { username, password } = req.body;
      const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
      const user = stmt.get(username, password);

      if (user) {
        // In a real app, you'd return a token (JWT)
        res.json({ success: true, message: 'Login berhasil' });
      } else {
        res.status(401).json({ success: false, message: 'Username atau password salah' });
      }
    } catch (error) {
      console.error('Login failed:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from 'dist'
    const __dirname = path.resolve();
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
