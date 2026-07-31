import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import ResponsesClient from './ResponsesClient';

export const revalidate = 0;

export default async function InterviewResponsesPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('interview_campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (campaignError || !campaign) {
    return <div>Campagne introuvable.</div>;
  }

  const { data: responses, error: responsesError } = await supabaseAdmin
    .from('interview_responses')
    .select('*')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false });

  if (responsesError) {
    return <div>Erreur lors de la récupération des réponses.</div>;
  }

  return (
    <div className="admin-content-card">
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link href="/admin/interviews" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '10px' }}>
            <i className="fas fa-arrow-left"></i> Retour aux campagnes
          </Link>
          <h1 className="admin-title" style={{ margin: 0 }}>Réponses : {campaign.title}</h1>
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <ResponsesClient campaign={campaign} responses={responses || []} />
      </div>
    </div>
  );
}
