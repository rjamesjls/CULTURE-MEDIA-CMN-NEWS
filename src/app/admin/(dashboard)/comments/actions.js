'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role to bypass RLS for admin actions
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function deleteComment(commentId) {
  try {
    const { error } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    
    return { success: true };
  } catch (err) {
    console.error('Error deleting comment:', err);
    return { success: false, error: err.message };
  }
}

export async function toggleCommentStatus(commentId, currentStatus) {
  try {
    const newStatus = currentStatus === 'approved' ? 'hidden' : 'approved';
    const { error } = await supabaseAdmin
      .from('comments')
      .update({ status: newStatus })
      .eq('id', commentId);

    if (error) throw error;

    return { success: true, newStatus };
  } catch (err) {
    console.error('Error toggling comment status:', err);
    return { success: false, error: err.message };
  }
}
