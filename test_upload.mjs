import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpload() {
  try {
    const base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const fileName = "test.png";
    const fileType = "image/png";
    const size = 100;
    const source = "generation";

    const hash = crypto.createHash('md5').update(base64).digest('hex');
    console.log("Hash:", hash);

    const { data: existingMedia, error: selectError } = await supabase
      .from('media_library')
      .select('file_url')
      .eq('hash', hash)
      .maybeSingle();

    if (selectError) {
      console.log("SELECT ERROR:", selectError);
      return;
    }

    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${fileName}`;
    const bucket = 'social_posts'; 

    console.log("Uploading to bucket:", bucket, "with name:", uniqueFileName);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(`library/${uniqueFileName}`, buffer, {
        contentType: fileType,
        upsert: false
      });

    if (uploadError) {
      console.log("UPLOAD ERROR:", uploadError);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`library/${uniqueFileName}`);

    const fileUrl = publicUrlData.publicUrl;
    console.log("File URL:", fileUrl);

    const { error: dbError } = await supabase
      .from('media_library')
      .insert({
        file_name: fileName,
        file_url: fileUrl,
        file_type: source,
        file_size: size,
        hash: hash
      });

    if (dbError) {
      console.log("INSERT ERROR:", dbError);
    } else {
      console.log("SUCCESS!");
    }

  } catch (error) {
    console.error("UNCAUGHT ERROR:", error);
  }
}
testUpload();
