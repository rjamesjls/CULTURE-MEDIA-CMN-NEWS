import { getArticleSpinoffs } from './actions';
import SpinoffsClient from './SpinoffsClient';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Déclinaisons Automatiques | CMN OS',
};

export const revalidate = 0; // Disable caching

export default async function SpinoffsPage(props) {
  const params = await props.params;
  const { id } = params;

  const res = await getArticleSpinoffs(id);

  if (!res.success) {
    notFound();
  }

  return (
    <SpinoffsClient 
      article={res.article} 
      initialSpinoffs={res.spinoffs} 
    />
  );
}
