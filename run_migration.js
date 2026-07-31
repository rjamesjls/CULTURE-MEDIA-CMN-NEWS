const fs = require('fs');
const { Client } = require('pg');

async function applyMigration() {
  const connectionString = 'postgresql://postgres:Cmnjames973@*@db.cklwlxjutudysxapieev.supabase.co:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to DB');
    
    const sql = fs.readFileSync('./supabase/migrations/add_social_features.sql', 'utf8');
    await client.query(sql);
    
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

applyMigration();
