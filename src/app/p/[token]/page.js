import { redirect } from 'next/navigation';

export default async function RedirectPrivateArticlePage({ params }) {
  const resolvedParams = await params;
  const token = resolvedParams.token;
  redirect(`/fr/p/${token}`);
}
