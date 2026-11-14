export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.afolukutv.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // On empêche Google d'indexer l'espace d'administration
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
