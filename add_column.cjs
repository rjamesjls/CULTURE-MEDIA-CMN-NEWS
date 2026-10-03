const { Client } = require('pg');

async function addColumn() {
  const client = new Client({
    connectionString: "postgres://postgres.yvifntjysxoweqchokxe:Culturesmedia@123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
  });
  
  await client.connect();
  try {
    await client.query("ALTER TABLE youtube_videos ADD COLUMN IF NOT EXISTS artist_name VARCHAR(255);");
    console.log("Column added successfully");
  } catch (err) {
    console.error("Error adding column", err);
  } finally {
    await client.end();
  }
}
addColumn();
