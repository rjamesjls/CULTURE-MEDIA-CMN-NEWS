'use client';

import { usePathname } from 'next/navigation';

export default function PublicOnly({ children }) {
  const pathname = usePathname();
  
  // Si on est sur une route admin, on ne rend pas le contenu (Header/Footer)
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }
  
  // Masquer le header et footer sur les pages de lecture de Web Magazine (pour une immersion totale)
  // Le chemin ressemble à /fr/magazine/slug-de-l-article
  if (pathname && pathname.match(/\/[a-z]{2,3}\/magazine\/.+/)) {
    return null;
  }
  
  return children;
}
