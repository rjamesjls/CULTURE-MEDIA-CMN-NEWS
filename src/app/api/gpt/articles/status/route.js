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

export async function PATCH(request) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { article_id, action } = body;

    if (!article_id || !action) {
      return NextResponse.json({ error: 'article_id and action are required' }, { status: 400 });
    }

    if (action === 'delete') {
      const { error } = await supabase.from('articles').delete().eq('id', article_id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Article deleted' });
    }

    let newStatus = 'draft';
    if (action === 'publish') newStatus = 'published';
    if (action === 'draft' || action === 'unpublish') newStatus = 'draft';

    const { data, error } = await supabase
      .from('articles')
      .update({ status: newStatus })
      .eq('id', article_id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Article introuvable avec cet ID' }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: newStatus, article: data });
  } catch (error) {
    console.error('GPT Article Status PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
