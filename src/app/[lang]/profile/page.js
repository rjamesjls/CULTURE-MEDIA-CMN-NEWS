import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileDashboardClient from './ProfileDashboardClient';

export const revalidate = 0; // Dynamic dashboard

export const metadata = {
  title: 'Tableau de bord Lecteur - A FOLUKU TV',
  description: 'Retrouvez vos articles favoris, vos commentaires et le flux exclusif des posts réseaux sociaux.'
};

export default async function ProfilePage(props) {
  const params = await props?.params;
  const lang = params?.lang || 'fr';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${lang}/auth/login?next=/${lang}/profile`);
  }

  // 1. Récupération du rôle utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = profile?.role || 'user';
  const userName = user.user_metadata?.name || 
                   user.user_metadata?.full_name || 
                   user.email.split('@')[0];

  // 2. Récupération des posts réseaux sociaux exclusifs aux lecteurs connectés
  const { data: rawArticles } = await supabase
    .from('articles')
    .select('id, title, title_bsh, slug, category, pub_date, instagram_state')
    .not('instagram_state', 'is', null)
    .order('pub_date', { ascending: false })
    .limit(60);

  const socialPosts = (rawArticles || [])
    .filter((art) => art.instagram_state?.sent_to_readers === true)
    .map((art) => ({
      id: art.id,
      title: art.title,
      title_bsh: art.title_bsh || art.title,
      slug: art.slug,
      category: art.category || 'Actualité',
      pub_date: art.pub_date,
      sent_at: art.instagram_state?.sent_to_readers_at || art.pub_date,
      image_fr: art.instagram_state?.reader_post_fr_image || null,
      image_bsh: art.instagram_state?.reader_post_bsh_image || null,
      caption: art.instagram_state?.reader_caption || art.instagram_state?.publishCaption || '',
      tags: art.instagram_state?.reader_tags || art.instagram_state?.instagramTags || '',
      theme_color: art.instagram_state?.reader_theme_color || 'red',
    }))
    .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());

  // 3. Récupération des derniers articles publiés
  const { data: latestArticles } = await supabase
    .from('articles')
    .select('id, title, title_bsh, slug, description, hook_bsh, image_url, category, pub_date, seo_metadata')
    .eq('status', 'published')
    .order('pub_date', { ascending: false })
    .limit(16);

  // 4. Récupération des articles favoris de l'utilisateur
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      id,
      article_id,
      created_at,
      articles (
        id,
        title,
        slug,
        image_url,
        category,
        pub_date
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 5. Récupération des commentaires de l'utilisateur
  const { data: comments } = await supabase
    .from('comments')
    .select('id, content, created_at, article_id, articles(title, slug)')
    .eq('author_name', userName)
    .order('created_at', { ascending: false })
    .limit(30);

  return (
    <ProfileDashboardClient
      user={user}
      userName={userName}
      userRole={userRole}
      lang={lang}
      socialPosts={socialPosts}
      latestArticles={latestArticles || []}
      initialBookmarks={bookmarks || []}
      initialComments={comments || []}
    />
  );
}
