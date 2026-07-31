import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Parse env file manually since dotenv is missing
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
};

async function run() {
  console.log("Fetching articles with broken images...");
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, image_url, slug')
    .like('image_url', '%culturemedianews.fr/wp-content%');

  if (error) {
    console.error("Error fetching articles:", error);
    return;
  }

  console.log(`Found ${articles.length} articles to fix.`);

  let successCount = 0;
  let failCount = 0;

  for (const article of articles) {
    try {
      // Force HTTPS
      const originalUrl = article.image_url.replace('http://', 'https://');
      const filename = path.basename(new URL(originalUrl).pathname);
      const tempPath = path.join('/tmp', filename);
      
      console.log(`Downloading ${originalUrl}...`);
      
      // Use curl to bypass DNS
      execSync(`curl -s -L --resolve culturemedianews.fr:443:82.25.113.162 "${originalUrl}" -o "${tempPath}"`, { stdio: 'ignore' });
      
      const fileBuffer = fs.readFileSync(tempPath);
      
      if (fileBuffer.length === 0) {
        throw new Error("Downloaded file is empty (0 bytes)");
      }
      
      const newPath = `articles/${article.slug}-${filename}`;
      
      console.log(`Uploading to Supabase: ${newPath} (${fileBuffer.length} bytes)...`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(newPath, fileBuffer, { 
           upsert: true,
           contentType: getMimeType(filename)
        });
        
      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(newPath);
        
      const newPublicUrl = publicUrlData.publicUrl;
      
      console.log(`Updating database for article ${article.slug}...`);
      
      const { error: updateError } = await supabase
        .from('articles')
        .update({ image_url: newPublicUrl })
        .eq('id', article.id);
        
      if (updateError) {
        throw new Error(`DB update error: ${updateError.message}`);
      }
      
      console.log(`✅ Success for ${article.slug}`);
      successCount++;
      
      // Clean up
      fs.unlinkSync(tempPath);
      
    } catch (err) {
      console.error(`❌ Failed for article ${article.id}:`, err.message);
      failCount++;
    }
  }
  
  console.log(`\nMigration completed! Success: ${successCount}, Failed: ${failCount}`);
}

run();
