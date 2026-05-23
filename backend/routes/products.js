const express = require('express');
const router = express.Router();
const { query, queryOne, insert, update, deleteQuery } = require('../config/dbHelper');
const { verifyToken, isAdmin } = require('../middleware/authJwt');

router.get('/', async (req, res) => {
    try {
        const { search, category } = req.query;
        let sql = 'SELECT * FROM products';
        const params = [];

        if (search || category) {
            const conditions = [];
            if (search) {
                conditions.push('(name ILIKE ? OR description ILIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }
            if (category) {
                conditions.push('category = ?');
                params.push(category);
            }
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        const products = await query(sql, params);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const product = await queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { name, description, price, quantity, supplierId, category, image_url } = req.body;

        if (!name || price === undefined || quantity === undefined) {
            return res.status(400).json({ message: 'Name, price and quantity are required' });
        }

        const result = await insert(
            'INSERT INTO products (name, description, price, quantity, "supplierId", category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, price, quantity, supplierId, category, image_url || null]
        );

        await insert(
            'INSERT INTO movements ("productId", type, quantity, description) VALUES (?, ?, ?, ?)',
            [result.insertId, 'entry', quantity, 'New product added']
        );

        res.status(201).json({ id: result.insertId, name, description, price, quantity, supplierId, category, image_url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { name, description, price, quantity, supplierId, category, image_url } = req.body;
        const product = await queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);

        if (!product) return res.status(404).json({ message: 'Product not found' });

        await update(
            'UPDATE products SET name = ?, description = ?, price = ?, quantity = ?, "supplierId" = ?, category = ?, image_url = ? WHERE id = ?',
            [
                name !== undefined ? name : product.name,
                description !== undefined ? description : product.description,
                price !== undefined ? price : product.price,
                quantity !== undefined ? quantity : product.quantity,
                supplierId !== undefined ? supplierId : product.supplierId,
                category !== undefined ? category : product.category,
                image_url !== undefined ? image_url : product.image_url,
                req.params.id
            ]
        );

        res.json({ id: req.params.id, name, description, price, quantity, supplierId, category, image_url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', [verifyToken, isAdmin], async (req, res) => {
    try {
        const product = await queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await deleteQuery('DELETE FROM movements WHERE "productId" = ?', [req.params.id]);
        await deleteQuery('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
