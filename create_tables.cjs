const { Client } = require('pg');

async function createTables() {
  const client = new Client({
    connectionString: "postgres://postgres.yvifntjysxoweqchokxe:Culturesmedia@123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
  });
  
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS youtube_channels (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          channel_id VARCHAR(255) UNIQUE NOT NULL,
          title VARCHAR(255) NOT NULL,
          sector VARCHAR(100),
          thumbnail_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("youtube_channels table created successfully");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS youtube_channel_stats_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          channel_id VARCHAR(255) REFERENCES youtube_channels(channel_id) ON DELETE CASCADE,
          views BIGINT DEFAULT 0,
          subscribers BIGINT DEFAULT 0,
          video_count INT DEFAULT 0,
          recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("youtube_channel_stats_history table created successfully");
  } catch (err) {
    console.error("Error creating tables", err);
  } finally {
    await client.end();
  }
}
createTables();
