import { getUserProfile } from '@/utils/supabase/auth';
import BroadcastController from './BroadcastController';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Broadcast Studio | AFOLUKUTV OS',
};

export default async function BroadcastStudioPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/admin/login');
  }

  return (
    <div style={{ 
      margin: '-20px', 
      padding: '40px 20px', 
      backgroundColor: '#09090b', 
      minHeight: 'calc(100vh - 60px)',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow Effects */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(9,9,11,0) 70%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(9,9,11,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }}></div>
      
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        <BroadcastController />
      </div>
    </div>
  );
}
