export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.culturemedia.news'; // Remplacez par le vrai domaine en prod

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // On empêche Google d'indexer l'espace d'administration
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
