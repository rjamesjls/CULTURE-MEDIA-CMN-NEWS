import './globals.css';
import Header from '@/components/Header';
import HeaderWrapper from '@/components/HeaderWrapper';
import BottomNavServer from '@/components/BottomNavServer';
import Footer from '@/components/Footer';
import NewsletterPopup from '@/components/NewsletterPopup';
import PublicOnly from '@/components/PublicOnly';
import Script from 'next/script';
import { headers } from 'next/headers';
import RadioPlayer from '@/components/RadioPlayer';
import { ArticleHeaderProvider } from '@/context/ArticleHeaderContext';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.afolukutv.com'),
  title: 'A FOLUKU TV',
  description: 'Le premier site dédié à l\'information et à la culture',
  keywords: ['Actualité', 'Culture', 'Information', 'Média', 'News', 'Web', 'Guyane'],
  openGraph: {
    title: 'A FOLUKU TV',
    description: 'Le premier site dédié à l\'information et à la culture',
    url: 'https://www.afolukutv.com',
    siteName: 'A FOLUKU TV',
    images: [
      {
        url: 'https://www.afolukutv.com/og-default.jpg',
        secureUrl: 'https://www.afolukutv.com/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'A FOLUKU TV',
        type: 'image/jpeg',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@afolukutv',
    title: 'A FOLUKU TV',
    description: 'Le premier site dédié à l\'information et à la culture',
    images: ['https://www.afolukutv.com/og-default.jpg'],
  },
};

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const lang = headersList.get('x-lang') || 'fr';

  return (
    <html lang={lang}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;700;800;900&display=swap" rel="stylesheet" />
        {/* Google Analytics */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-JT074LPWDE" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-JT074LPWDE');
          `}
        </Script>
      </head>
      <body>
        <ArticleHeaderProvider>
          <PublicOnly>
            <HeaderWrapper>
              <Header lang={lang} />
            </HeaderWrapper>
          </PublicOnly>
          <main>{children}</main>
          <PublicOnly>
            <Footer lang={lang} />
            <NewsletterPopup lang={lang} />
            <BottomNavServer lang={lang} />
          </PublicOnly>
        </ArticleHeaderProvider>
        {/* Scripts globaux */}
        <Script src="/js/main.js" strategy="lazyOnload" />
        <Script src="/js/carousel.js" strategy="lazyOnload" />
        {/* <Script src="/js/theme-switcher.js" strategy="lazyOnload" /> */}
        {/* Player radio désactivé du pied de page
        <PublicOnly>
          <RadioPlayer />
        </PublicOnly>
        */}
      </body>
    </html>
  );
}
