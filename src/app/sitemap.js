import { createClient } from '@supabase/supabase-js';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.culturemedia.news'; // Remplacez par le vrai domaine en prod
  
  // Utilisation du client public anonyme pour récupérer les articles publiés
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: articles } = await supabase
    .from('articles')
    .select('slug, pub_date, updated_at')
    .eq('status', 'published')
    .order('pub_date', { ascending: false });

  const articleEntries = (articles || []).map((article) => ({
    url: `${baseUrl}/article/${article.slug}`,
    lastModified: article.updated_at || article.pub_date || new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Routes statiques principales
  const staticRoutes = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: `${baseUrl}/faits-divers`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/all-articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // TODO: On pourrait aussi ajouter les catégories dynamiquement si on le souhaite

  return [...staticRoutes, ...articleEntries];
}
