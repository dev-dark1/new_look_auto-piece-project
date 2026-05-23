const express = require('express');
const router = express.Router();
const { query, queryOne, insert, update } = require('../config/dbHelper');
const { verifyToken, isAdmin } = require('../middleware/authJwt');

router.post('/', [verifyToken], async (req, res) => {
    try {
        const { items, paymentMethod } = req.body;

        for (const item of items) {
            const product = await queryOne('SELECT * FROM products WHERE id = ?', [item.productId]);
            if (!product || product.quantity < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for product ${product ? product.name : item.productId}` });
            }
        }

        let total = 0;
        for (const item of items) {
            const product = await queryOne('SELECT price FROM products WHERE id = ?', [item.productId]);
            total += (product.price * item.quantity);
        }

        const orderResult = await insert(
            'INSERT INTO orders ("userId", status, total) VALUES (?, ?, ?)',
            [req.userId, 'pending', total]
        );

        for (const item of items) {
            const product = await queryOne('SELECT price FROM products WHERE id = ?', [item.productId]);
            await insert(
                'INSERT INTO order_items ("orderId", "productId", quantity, price) VALUES (?, ?, ?, ?)',
                [orderResult.insertId, item.productId, item.quantity, product.price]
            );

            await update(
                'UPDATE products SET quantity = quantity - ? WHERE id = ?',
                [item.quantity, item.productId]
            );

            await insert(
                'INSERT INTO movements ("productId", type, quantity, description) VALUES (?, ?, ?, ?)',
                [item.productId, 'exit', item.quantity, `Order #${orderResult.insertId} placed by user ${req.userId}`]
            );
        }

        res.status(201).json({ id: orderResult.insertId, userId: req.userId, items, paymentMethod, status: 'pending', total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', [verifyToken], async (req, res) => {
    try {
        const orders = await query(
            'SELECT o.*, COUNT(oi.id) as "itemCount" FROM orders o LEFT JOIN order_items oi ON o.id = oi."orderId" WHERE o."userId" = ? GROUP BY o.id',
            [req.userId]
        );
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/all', [verifyToken, isAdmin], async (req, res) => {
    try {
        const orders = await query(
            'SELECT o.*, u.username, COUNT(oi.id) as "itemCount" FROM orders o LEFT JOIN users u ON o."userId" = u.id LEFT JOIN order_items oi ON o.id = oi."orderId" GROUP BY o.id, u.username ORDER BY o.created_at DESC'
        );
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/status', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { status } = req.body;
        const order = await queryOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        await update('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ ...order, status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/cancel', [verifyToken], async (req, res) => {
    try {
        const order = await queryOne('SELECT * FROM orders WHERE id = ? AND "userId" = ?', [req.params.id, req.userId]);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status === 'cancelled') return res.status(400).json({ message: 'Order already cancelled' });

        await update('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', req.params.id]);

        const orderItems = await query('SELECT * FROM order_items WHERE "orderId" = ?', [req.params.id]);
        for (const item of orderItems) {
            await update(
                'UPDATE products SET quantity = quantity + ? WHERE id = ?',
                [item.quantity, item.productId]
            );
            await insert(
                'INSERT INTO movements ("productId", type, quantity, description) VALUES (?, ?, ?, ?)',
                [item.productId, 'entry', item.quantity, `Order #${req.params.id} cancelled`]
            );
        }

        res.json({ ...order, status: 'cancelled' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
