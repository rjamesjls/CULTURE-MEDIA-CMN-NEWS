import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import InterviewClient from './InterviewClient';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { data: campaign } = await supabase
    .from('interview_campaigns')
    .select('title, description')
    .eq('token', resolvedParams.token)
    .eq('is_active', true)
    .single();

  if (!campaign) return { title: 'Interview non trouvée' };

  return {
    title: `Interview : ${campaign.title} | A FOLUKU TV`,
    description: campaign.description
  };
}

export default async function InterviewPage({ params }) {
  const resolvedParams = await params;
  
  const { data: campaign, error } = await supabase
    .from('interview_campaigns')
    .select('*')
    .eq('token', resolvedParams.token)
    .eq('is_active', true)
    .single();

  if (error || !campaign) {
    notFound();
  }

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '1px' }}>
      {/* Include global styles or just use inline since it's a specific page */}
      <style>{`
        body { margin: 0; font-family: var(--font-sans); }
        .btn { display: inline-block; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 500; transition: all 0.2s; border: none; cursor: pointer; }
        .btn-primary { background-color: var(--color-primary); color: white; }
        .btn-primary:hover { background-color: #b91c1c; }
      `}</style>
      <InterviewClient campaign={campaign} />
    </div>
  );
}
