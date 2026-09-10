import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We use the service role key because GPT API calls don't have a browser session.
// We secure the endpoint via a Bearer token (GPT_API_SECRET)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function checkAuth(request) {
  // Check standard Authorization: Bearer
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token === process.env.GPT_API_SECRET) return true;
  }
  
  // Check custom X-Api-Key header
  const customHeader = request.headers.get('x-api-key');
  if (customHeader && customHeader === process.env.GPT_API_SECRET) {
    return true;
  }
  
  return false;
}

export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ categories: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
