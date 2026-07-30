import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import InstagramGenerator from './InstagramGenerator';

export const revalidate = 0; // Don't cache admin pages

export default async function InstagramGeneratorPage(props) {
  const params = await props.params;
  const supabase = await createClient();
  const { id } = params;

  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, category, pub_date, slug, image_url, user_id, content')
    .eq('id', id)
    .single();

  if (error || !article) {
    console.error('Error fetching article for Instagram generator:', error);
    notFound();
  }

  return (
    <div>
      <InstagramGenerator article={article} />
    </div>
  );
}
