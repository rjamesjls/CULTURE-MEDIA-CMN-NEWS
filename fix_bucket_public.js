// env injected via command line
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Checking bucket 'media'...");
  
  // 1. Ensure bucket exists and is public
  const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('media');
  if (bucketError) {
    if (bucketError.message.includes('not found') || bucketError.message.includes('Resource not found')) {
      console.log("Bucket not found, creating it as public...");
      const { data: createData, error: createError } = await supabase.storage.createBucket('media', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
      });
      if (createError) console.error("Error creating bucket:", createError);
      else console.log("Created successfully:", createData);
    } else {
      console.error("Error fetching bucket:", bucketError);
    }
  } else {
    console.log("Bucket exists. Is public?", bucketData.public);
    if (!bucketData.public) {
      console.log("Updating bucket to be public...");
      const { data: updateData, error: updateError } = await supabase.storage.updateBucket('media', {
        public: true
      });
      if (updateError) console.error("Error updating bucket:", updateError);
      else console.log("Updated bucket to public:", updateData);
    }
  }

  // 2. Ensure basic SELECT policy exists (just in case public=true is not enough or RLS blocks it)
  // We can just rely on `public: true` for storage buckets which allows public read access.
  console.log("Public URL check:");
  const testUrl = supabase.storage.from('media').getPublicUrl('test.png');
  console.log(testUrl.data.publicUrl);
  
  console.log("Done.");
}

main();
