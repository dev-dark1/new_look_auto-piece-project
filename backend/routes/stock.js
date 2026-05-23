const express = require('express');
const router = express.Router();
const { query, queryOne, insert, update } = require('../config/dbHelper');
const { verifyToken, isAdmin } = require('../middleware/authJwt');

router.get('/movements', [verifyToken, isAdmin], async (req, res) => {
    try {
        const movements = await query(
            'SELECT m.*, p.name as "productName" FROM movements m JOIN products p ON m."productId" = p.id ORDER BY m.created_at DESC LIMIT 50'
        );
        res.json(movements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/adjust', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { productId, quantity, type, description } = req.body;
        const product = await queryOne('SELECT * FROM products WHERE id = ?', [productId]);

        if (!product) return res.status(404).json({ message: 'Product not found' });

        const qty = Number(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        if (type === 'entry') {
            await update('UPDATE products SET quantity = quantity + ? WHERE id = ?', [qty, productId]);
        } else if (type === 'exit') {
            if (product.quantity < qty) {
                return res.status(400).json({ message: 'Insufficient stock' });
            }
            await update('UPDATE products SET quantity = quantity - ? WHERE id = ?', [qty, productId]);
        } else {
            return res.status(400).json({ message: 'Invalid movement type' });
        }

        const movementResult = await insert(
            'INSERT INTO movements ("productId", type, quantity, description) VALUES (?, ?, ?, ?)',
            [productId, type, qty, description || 'Manual adjustment']
        );

        const updatedProduct = await queryOne('SELECT * FROM products WHERE id = ?', [productId]);
        res.status(201).json({ product: updatedProduct, movement: { id: movementResult.insertId, productId, type, quantity: qty, description } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/summary', [verifyToken, isAdmin], async (req, res) => {
    try {
        const stock = await query(
            'SELECT id, name, quantity, category FROM products ORDER BY quantity ASC'
        );
        res.json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
