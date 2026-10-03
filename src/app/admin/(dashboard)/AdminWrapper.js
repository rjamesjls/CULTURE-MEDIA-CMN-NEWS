'use client';
import { usePathname } from 'next/navigation';

export default function AdminWrapper({ children }) {
  const pathname = usePathname();
  const isWebRadio = pathname === '/admin/webradio' || pathname?.startsWith('/admin/webradio/');
  const isFlashGenerator = pathname === '/admin/flash-generator' || pathname?.startsWith('/admin/flash-generator/');
  const hideSidebar = isWebRadio || isFlashGenerator;
  return (
    <div className={`admin-wrapper ${hideSidebar ? 'hide-sidebar' : ''}`}>
      {children}
    </div>
  );
}
