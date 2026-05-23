const express = require('express');
const router = express.Router();
const { query, queryOne, insert, update, deleteQuery } = require('../config/dbHelper');
const { verifyToken, isAdmin } = require('../middleware/authJwt');

router.get('/', [verifyToken], async (req, res) => {
    try {
        const suppliers = await query('SELECT * FROM suppliers');
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { name, contact } = req.body;
        if (!name) return res.status(400).json({ message: 'Supplier name is required' });

        const result = await insert(
            'INSERT INTO suppliers (name, contact) VALUES (?, ?)',
            [name, contact]
        );
        res.status(201).json({ id: result.insertId, name, contact });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { name, contact } = req.body;
        const supplier = await queryOne('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);

        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

        await update(
            'UPDATE suppliers SET name = ?, contact = ? WHERE id = ?',
            [name || supplier.name, contact || supplier.contact, req.params.id]
        );

        res.json({ id: req.params.id, name: name || supplier.name, contact: contact || supplier.contact });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', [verifyToken, isAdmin], async (req, res) => {
    try {
        const supplier = await queryOne('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

        await deleteQuery('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
