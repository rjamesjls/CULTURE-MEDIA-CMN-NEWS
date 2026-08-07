'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function uploadFile(file, folder) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const path = `interviews/${folder}/${fileName}`;

  const { error: uploadError } = await supabaseAdmin
    .storage
    .from('images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return null;
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from('images').getPublicUrl(path);
  return publicUrlData.publicUrl;
}

export async function submitInterviewResponse(formData) {
  try {
    const campaignId = formData.get('campaignId');
    const name = formData.get('name');
    const email = formData.get('email');
    
    // Parse text answers
    const answers = {};
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('question_')) {
        const index = key.replace('question_', '');
        answers[index] = value;
      }
    }

    // Upload photo
    let photoUrl = null;
    const photoFile = formData.get('photo');
    if (photoFile && photoFile.size > 0) {
      photoUrl = await uploadFile(photoFile, 'photos');
    }

    // Upload voice recordings
    const voiceUrls = {};
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('voice_') && value && value.size > 0) {
        const index = key.replace('voice_', '');
        const url = await uploadFile(value, 'voices');
        if (url) voiceUrls[index] = url;
      }
    }

    // Upload attached files
    const fileUrls = {};
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value && value.size > 0) {
        const index = key.replace('file_', '');
        const url = await uploadFile(value, 'attachments');
        if (url) {
          if (!fileUrls[index]) fileUrls[index] = [];
          fileUrls[index].push({ url, name: value.name, type: value.type });
        }
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from('interview_responses')
      .insert([
        {
          campaign_id: parseInt(campaignId),
          interviewee_name: name,
          interviewee_email: email,
          answers: answers,
          photo_url: photoUrl,
          voice_urls: voiceUrls,
          file_urls: fileUrls
        }
      ]);

    if (insertError) throw insertError;

    return { success: true };
  } catch (err) {
    console.error("Error submitting interview response:", err);
    return { success: false, error: err.message };
  }
}
