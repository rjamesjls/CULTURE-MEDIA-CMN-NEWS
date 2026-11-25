import { getAllBannersAdmin } from '@/lib/ads';
import AdsAdminClient from './AdsAdminClient';

export const revalidate = 0;

export const metadata = {
  title: 'Régie Publicitaire & Bannières - Admin',
};

export default async function AdminAdsPage() {
  const banners = await getAllBannersAdmin();

  return (
    <div>
      <AdsAdminClient initialBanners={banners || []} />
    </div>
  );
}
