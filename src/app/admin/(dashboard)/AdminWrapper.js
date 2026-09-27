'use client';
import { usePathname } from 'next/navigation';

export default function AdminWrapper({ children }) {
  const pathname = usePathname();
  const isWebRadio = pathname === '/admin/webradio' || pathname?.startsWith('/admin/webradio/');
  return (
    <div className={`admin-wrapper ${isWebRadio ? 'hide-sidebar' : ''}`}>
      {children}
    </div>
  );
}
