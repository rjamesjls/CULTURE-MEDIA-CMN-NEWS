import { createClient } from '@/utils/supabase/server';
import PageForm from '../../PageForm';
import { notFound } from 'next/navigation';

export default async function EditPage({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .single();

  if (!page) {
    notFound();
  }

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-heading)', color: '#111827', marginBottom: '20px' }}>
        Modifier la page
      </h2>
      <PageForm initialData={page} />
    </div>
  );
}
