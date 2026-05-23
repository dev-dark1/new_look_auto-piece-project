const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

pool.connect()
  .then(client => {
    console.log('✓ Database pool connection successful');
    client.release();
  })
  .catch(err => {
    console.error('✗ Database pool connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
