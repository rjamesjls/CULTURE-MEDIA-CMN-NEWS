import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase';

export const revalidate = 60; // Cache redirect 1 minute

export async function generateMetadata(props) {
  const params = await props?.params;
  const idOrSlug = params?.id;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.afolukutv.com';

  if (!idOrSlug) {
    return {
      title: 'A FOLUKU TV',
    };
  }

  const isNumeric = /^\d+$/.test(idOrSlug);

  let query = supabase
    .from('articles')
    .select('id, title, title_bsh, description, hook_bsh, image_url, category, slug, pub_date, created_at')
    .limit(1);

  if (isNumeric) {
    query = query.eq('id', parseInt(idOrSlug, 10));
  } else {
    query = query.eq('slug', idOrSlug);
  }

  const { data: article } = await query.maybeSingle();

  if (!article || !article.slug) {
    return {
      title: 'Article non trouvé | A FOLUKU TV',
    };
  }

  const title = article.title;
  const description = article.description || "Retrouvez toute l'actualité et la culture sur A FOLUKU TV";
  const slug = article.slug;
  const categoryName = article.category || 'Actualité';
  const ogImageUrl = `${baseUrl}/api/og-image?slug=${encodeURIComponent(slug)}`;
  const shortUrl = `${baseUrl}/a/${article.id || idOrSlug}`;

  let rawImage = article.image_url;
  if (rawImage && rawImage.startsWith('/')) {
    rawImage = `${baseUrl}${rawImage}`;
  }

  const images = [
    {
      url: ogImageUrl,
      secureUrl: ogImageUrl,
      width: 1200,
      height: 630,
      alt: title,
      type: 'image/jpeg',
    },
  ];

  if (rawImage && rawImage.startsWith('https://') && rawImage !== ogImageUrl) {
    images.push({
      url: rawImage,
      secureUrl: rawImage,
      alt: title,
    });
  }

  return {
    title: `${title} | A FOLUKU TV`,
    description: description,
    alternates: {
      canonical: `${baseUrl}/fr/article/${slug}`,
    },
    openGraph: {
      title: title,
      description: description,
      url: shortUrl,
      siteName: 'A FOLUKU TV',
      locale: 'fr_FR',
      type: 'article',
      publishedTime: article.pub_date,
      modifiedTime: article.created_at || article.pub_date,
      section: categoryName,
      images: images,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@afolukutv',
      title: title,
      description: description,
      images: [ogImageUrl],
    },
    other: {
      'image_src': ogImageUrl,
      'og:image:secure_url': ogImageUrl,
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/jpeg',
    },
  };
}

export default async function ShortLinkPage(props) {
  const params = await props?.params;
  const idOrSlug = params?.id;

  if (!idOrSlug) {
    notFound();
  }

  const isNumeric = /^\d+$/.test(idOrSlug);

  let query = supabase
    .from('articles')
    .select('id, title, slug')
    .limit(1);

  if (isNumeric) {
    query = query.eq('id', parseInt(idOrSlug, 10));
  } else {
    query = query.eq('slug', idOrSlug);
  }

  const { data: article, error } = await query.maybeSingle();

  if (error || !article || !article.slug) {
    notFound();
  }

  const targetUrl = `/fr/article/${article.slug}`;

  // Détection des robots de prévisualisation (WhatsApp, Facebook, Twitter, Telegram, Discord...)
  // Pour les robots, on sert le HTML (statut 200) avec les métadonnées OpenGraph et une balise meta refresh.
  // Pour les humains sur navigateur, on effectue une redirection 307 instantanée.
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isBot = /bot|crawl|spider|facebookexternalhit|whatsapp|facebot|twitterbot|linkedin|slack|discord|preview/i.test(userAgent);

  if (!isBot) {
    redirect(targetUrl);
  }

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <meta httpEquiv="refresh" content={`0;url=${targetUrl}`} />
      <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '16px', maxWidth: '600px' }}>
        {article.title}
      </h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Redirection en cours vers l&apos;article sur A FOLUKU TV...
      </p>
      <a
        href={targetUrl}
        style={{
          display: 'inline-block',
          backgroundColor: '#ec4899',
          color: '#ffffff',
          padding: '10px 24px',
          borderRadius: '8px',
          fontWeight: '600',
          textDecoration: 'none',
        }}
      >
        Lire l&apos;article
      </a>
    </div>
  );
}
