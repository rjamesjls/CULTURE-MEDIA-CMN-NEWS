const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function main() {
  const { data, error } = await supabase.storage.getBucket('media');
  console.log("Bucket info:", data);
  if (data && data.public === false) {
    const { data: updateData, error: updateError } = await supabase.storage.updateBucket('media', {
      public: true
    });
    console.log("Update result:", updateData, updateError);
  }
}
main();
