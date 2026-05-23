const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const supplierRoutes = require('./routes/suppliers');
const orderRoutes = require('./routes/orders');
const stockRoutes = require('./routes/stock');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.send('Auto-Piece API is running...');
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await pool.end();
    process.exit(0);
});

app.listen(PORT, 'localhost', () => {
    console.log(`Server is running on port ${PORT}`);
});
