import { getAllBannersAdmin } from '@/lib/ads';
import { supabase } from '@/lib/supabase';
import AdsAdminClient from './AdsAdminClient';

export const revalidate = 0;

export const metadata = {
  title: 'Régie Publicitaire & Bannières - Admin',
};

export default async function AdminAdsPage() {
  const [banners, { data: articles }] = await Promise.all([
    getAllBannersAdmin(),
    supabase
      .from('articles')
      .select('id, title, slug, image_url, description, category, author, pub_date')
      .eq('status', 'published')
      .order('pub_date', { ascending: false })
      .limit(60),
  ]);

  return (
    <div>
      <AdsAdminClient initialBanners={banners || []} articles={articles || []} />
    </div>
  );
}
