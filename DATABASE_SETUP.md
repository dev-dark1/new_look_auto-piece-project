# Database Configuration & Usage Guide

## ✅ Setup Complete

Your Auto-Piece project is now configured with a MySQL connection pool for the `autopiece_db` database.

## 📋 Configuration Files Created

1. **`config/database.js`** - Connection pool initialization
   - Handles connection pooling (10 connections max)
   - Auto-reconnection enabled
   - Connection testing on startup

2. **`config/dbHelper.js`** - Database helper functions
   - `query(sql, params)` - Execute queries
   - `queryOne(sql, params)` - Get single row
   - `insert(sql, params)` - Insert records
   - `update(sql, params)` - Update records
   - `deleteQuery(sql, params)` - Delete records

3. **`.env`** - Environment variables
   - `DB_HOST=localhost`
   - `DB_USER=root`
   - `DB_PASSWORD=` (update if needed)
   - `DB_NAME=autopiece_db`

## 🚀 Usage Examples in Routes

### Example 1: Query with dbHelper (Recommended)

```javascript
const express = require('express');
const router = express.Router();
const { query, queryOne, insert } = require('../config/dbHelper');

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await query('SELECT * FROM products');
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product
router.post('/', async (req, res) => {
    try {
        const { name, description, price, quantity, supplierId, category } = req.body;
        const result = await insert(
            'INSERT INTO products (name, description, price, quantity, supplierId, category) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, quantity, supplierId, category]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

### Example 2: Direct Pool Usage

```javascript
const pool = require('../config/database');

router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM products');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
});
```

## 🗄️ Database Schema

Create your tables in the `autopiece_db` database:

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    quantity INT DEFAULT 0,
    supplierId INT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplierId) REFERENCES suppliers(id)
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    status VARCHAR(50) DEFAULT 'pending',
    total DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT,
    productId INT,
    quantity INT,
    price DECIMAL(10, 2),
    FOREIGN KEY (orderId) REFERENCES orders(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);

CREATE TABLE stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    productId INT,
    quantity INT,
    warehouse_location VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id)
);
```

## 🔧 Connection Pool Benefits

✅ **Connection Reuse** - Connections are pooled and reused  
✅ **Performance** - Reduces connection overhead  
✅ **Scalability** - Handles concurrent requests efficiently  
✅ **Reliability** - Keep-alive enabled, auto-reconnection  
✅ **Graceful Shutdown** - Proper cleanup on server termination  

## 📝 Next Steps

1. Update your `.env` file with actual database credentials if needed
2. Create the database tables using the schema above
3. Migrate your routes from `data/store.js` to use `dbHelper` functions
4. Run `npm install` (already done ✓)
5. Start the server: `node server.js`

## 🐛 Troubleshooting

**Connection refused?**
- Ensure MySQL is running on localhost:3306
- Verify database credentials in `.env`
- Check that `autopiece_db` database exists

**Pool exhausted?**
- Ensure connections are released (using try/finally or dbHelper)
- Check for connection leaks in your code
- Increase `connectionLimit` in `config/database.js` if needed

## 📚 Database Helper Functions

```javascript
const { query, queryOne, insert, update, deleteQuery, pool } = require('../config/dbHelper');

// Simplified usage - no need to manage connections!
const users = await query('SELECT * FROM users');
const user = await queryOne('SELECT * FROM users WHERE id = ?', [1]);
const result = await insert('INSERT INTO users (username, password) VALUES (?, ?)', ['john', 'hash']);
const updated = await update('UPDATE users SET role = ? WHERE id = ?', ['admin', 1]);
const deleted = await deleteQuery('DELETE FROM users WHERE id = ?', [1]);
```

---

**Your project is now database-ready with connection pooling! 🎉**
