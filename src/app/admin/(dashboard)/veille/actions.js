'use server';

import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import Parser from 'rss-parser';

export async function getNewsSources() {
  try {
    const supabase = await createClient();
    const profile = await getUserProfile();
    
    if (!profile) return { success: false, error: "Non autorisé" };

    const { data, error } = await supabase
      .from('news_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST204' || error.code === 'PGRST205') {
        // Relation does not exist (table not created yet)
        return { success: false, data: [], error: 'TABLE_NOT_FOUND' };
      }
      return { success: false, error: `Erreur Supabase (${error.code}): ${error.message}` };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: `Erreur inattendue: ${err.message}` };
  }
}

export async function addNewsSource(name, url) {
  try {
    const supabase = await createClient();
    const profile = await getUserProfile();
    
    if (!profile) return { success: false, error: "Non autorisé" };

    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      return { success: false, error: "L'URL fournie n'est pas valide." };
    }

    const { data, error } = await supabase
      .from('news_sources')
      .insert([{ name, url, user_id: profile.id }])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: `Erreur inattendue: ${err.message}` };
  }
}

export async function deleteNewsSource(id) {
  try {
    const supabase = await createClient();
    const profile = await getUserProfile();
    
    if (!profile) return { success: false, error: "Non autorisé" };

    const { error } = await supabase
      .from('news_sources')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: `Erreur inattendue: ${err.message}` };
  }
}

export async function fetchRSSFeeds(sources) {
  const parser = new Parser({
    customFields: {
      item: ['description', 'pubDate', 'content:encoded', 'enclosure', 'media:content'],
    }
  });

  let allFeedItems = [];

  for (const source of sources) {
    try {
      // Node.js fetch can sometimes have issues with strict CORS/SSL from rss sources. 
      // rss-parser uses http/https module natively.
      const feed = await parser.parseURL(source.url);
      
      const items = feed.items.map(item => {
        // Try to find an image if available
        let imageUrl = null;
        if (item.enclosure && item.enclosure.url) {
          imageUrl = item.enclosure.url;
        } else if (item['media:content'] && item['media:content'].$) {
          imageUrl = item['media:content'].$.url;
        }

        return {
          id: item.guid || item.id || item.link || Math.random().toString(),
          title: item.title,
          link: item.link,
          description: item.contentSnippet || item.description || '',
          pubDate: item.pubDate || item.isoDate,
          sourceName: source.name,
          sourceUrl: source.url,
          imageUrl: imageUrl
        };
      });

      allFeedItems = [...allFeedItems, ...items];
    } catch (error) {
      console.error(`Erreur lors de la lecture du flux ${source.name} (${source.url}):`, error);
      // On continue silencieusement pour ne pas bloquer les autres flux
    }
  }

  // Sort by date descending
  allFeedItems.sort((a, b) => {
    const dateA = new Date(a.pubDate || 0);
    const dateB = new Date(b.pubDate || 0);
    return dateB - dateA;
  });

  return { success: true, data: allFeedItems };
}
