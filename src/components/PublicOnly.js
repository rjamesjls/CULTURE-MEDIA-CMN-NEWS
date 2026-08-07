'use client';

import { usePathname } from 'next/navigation';

export default function PublicOnly({ children }) {
  const pathname = usePathname();
  
  // Si on est sur une route admin, on ne rend pas le contenu (Header/Footer)
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }
  
  return children;
}
