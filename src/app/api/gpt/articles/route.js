import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function checkAuth(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  return token === process.env.GPT_API_SECRET;
}

export async function GET(request) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    let query = supabase
      .from('articles')
      .select('id, title, status, pub_date, slug, category, author')
      .order('pub_date', { ascending: false })
      .limit(20);

    if (status && ['draft', 'published'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ articles: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, content, category, image_url, seo_title, seo_description, slug, status } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: 'title, content, and category are required' }, { status: 400 });
    }

    // Default to draft to protect from accidental publishing
    const articleStatus = status === 'published' ? 'published' : 'draft';
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newArticle = {
      title,
      description: description || '',
      content,
      category,
      image_url: image_url || null,
      status: articleStatus,
      slug: finalSlug,
      author: 'La Rédaction',
      pub_date: new Date().toISOString(),
      seo_metadata: {
        title: seo_title || title,
        description: seo_description || description || ''
      }
    };

    const { data, error } = await supabase
      .from('articles')
      .insert([newArticle])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, article: data });
  } catch (error) {
    console.error('GPT Article POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
