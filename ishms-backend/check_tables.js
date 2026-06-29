const { Pool } = require('pg');

async function check(port) {
  const connectionString = `postgresql://postgres:swati26@127.0.0.1:${port}/ishms_db`;
  console.log(`Checking port ${port}...`);
  const pool = new Pool({ connectionString });
  try {
    const infoRes = await pool.query("SELECT current_database(), current_schema(), inet_server_port()");
    console.log(`Port ${port} Info:`, infoRes.rows[0]);
    
    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log(`Port ${port} Tables:`, tablesRes.rows.map(r => r.table_name));
  } catch (err) {
    console.log(`Port ${port} failed: ${err.message}`);
  } finally {
    await pool.end();
  }
}

async function run() {
  await check(5435);
  await check(5432);
}

run();
