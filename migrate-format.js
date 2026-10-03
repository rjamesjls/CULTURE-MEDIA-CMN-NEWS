const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Extract connection string from env
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
const connectionString = match ? match[1] : null;

if (!connectionString) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Add column if it doesn't exist
    await client.query(`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS article_format VARCHAR(50) DEFAULT 'standard';
    `);

    // Update existing rows (optional, since default handles it)
    await client.query(`
      UPDATE articles SET article_format = 'standard' WHERE article_format IS NULL;
    `);

    await client.query('COMMIT');
    console.log('Migration completed: article_format added.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
