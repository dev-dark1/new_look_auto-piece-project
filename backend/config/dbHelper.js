const pool = require('./database');

async function query(sql, params = []) {
  const pgSql = convertToPostgres(sql, params);
  const result = await pool.query(pgSql, params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function insert(sql, params = []) {
  const pgSql = convertToPostgres(sql, params) + ' RETURNING *';
  const result = await pool.query(pgSql, params);
  return { insertId: result.rows[0]?.id, ...result.rows[0] };
}

async function update(sql, params = []) {
  const pgSql = convertToPostgres(sql, params);
  const result = await pool.query(pgSql, params);
  return { affectedRows: result.rowCount };
}

async function deleteQuery(sql, params = []) {
  const pgSql = convertToPostgres(sql, params);
  const result = await pool.query(pgSql, params);
  return { affectedRows: result.rowCount };
}

function convertToPostgres(sql, params) {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

module.exports = {
  query,
  queryOne,
  insert,
  update,
  deleteQuery,
  pool
};
