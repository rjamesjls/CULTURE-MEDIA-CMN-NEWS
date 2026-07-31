import { createClient } from '@supabase/supabase-js';
import CommentsClient from './CommentsClient';

export const revalidate = 0; // Always fresh in admin

export default async function CommentsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Use admin client to bypass RLS and fetch all comments (even hidden ones if any)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const { data: comments, error } = await supabaseAdmin
    .from('comments')
    .select(`
      *,
      articles (
        id,
        title,
        slug
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Erreur lors du chargement des commentaires : {error.message}</div>;
  }

  return <CommentsClient initialComments={comments || []} />;
}
