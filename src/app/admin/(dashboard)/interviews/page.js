import { createClient } from '@supabase/supabase-js';
import InterviewsClient from './InterviewsClient';

export const revalidate = 0;

export default async function InterviewsAdminPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch campaigns with response count
  const { data: campaigns, error } = await supabaseAdmin
    .from('interview_campaigns')
    .select(`
      *,
      interview_responses(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Erreur lors du chargement des campagnes : {error.message}</div>;
  }

  return <InterviewsClient initialCampaigns={campaigns || []} />;
}
