import { createClient } from '@/utils/supabase/server';
import WidgetsClient from './WidgetsClient';

export const metadata = {
  title: 'Outils externes - Admin',
};

export const revalidate = 0;

export default async function WidgetsPage() {
  const supabase = await createClient();

  // Fetch widgets (fails silently if table doesn't exist yet, we'll handle it)
  const { data: widgets, error } = await supabase
    .from('admin_widgets')
    .select('*')
    .order('created_at', { ascending: true });

  const widgetList = widgets || [];

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Outils externes (Widgets)</h2>
        <p style={{ color: '#6b7280' }}>
          Intégrez vos outils tiers (Analytics, Stripe, Canva...) directement dans votre tableau de bord.
        </p>
      </div>

      <WidgetsClient initialWidgets={widgetList} tableExists={!error || error.code !== '42P01'} />
    </div>
  );
}
