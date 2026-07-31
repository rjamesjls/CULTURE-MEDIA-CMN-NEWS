import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchArticle(id) {
  try {
    const res = await fetch(`https://culturemedianews.fr/wp-json/wp/v2/posts/${id}`);
    if (!res.ok) {
      console.error('Failed to fetch post', res.statusText);
      return;
    }
    const post = await res.json();
    console.log(`Fetched post: ${post.title.rendered}`);

    let categoryStr = 'Général';
    if (post.categories && post.categories.length > 0) {
      const catRes = await fetch(`https://culturemedianews.fr/wp-json/wp/v2/categories/${post.categories[0]}`);
      if (catRes.ok) {
        const cat = await catRes.json();
        categoryStr = cat.name;
      }
    }
    
    let imageUrl = null;
    if (post.featured_media) {
      const mediaRes = await fetch(`https://culturemedianews.fr/wp-json/wp/v2/media/${post.featured_media}`);
      if (mediaRes.ok) {
        const media = await mediaRes.json();
        imageUrl = media.source_url;
      }
    }

    const { error } = await supabase.from('articles').upsert({
      title: post.title.rendered,
      slug: post.slug,
      content: post.content.rendered,
      excerpt: post.excerpt.rendered,
      category: categoryStr,
      image_url: imageUrl,
      author: 'La Rédaction',
      status: 'published',
      pub_date: post.date
    }, { onConflict: 'slug' });

    if (error) {
      console.error('Error inserting post', error);
    } else {
      console.log('Post inserted successfully!');
    }
  } catch (err) {
    console.error(err);
  }
}

fetchArticle(1667);
