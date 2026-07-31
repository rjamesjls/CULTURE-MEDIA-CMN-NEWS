import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsletterPopup from '@/components/NewsletterPopup';
import Script from 'next/script';

export const metadata = {
  title: 'Culture Média News',
  description: 'Le premier site dédié à l\'information et à la culture',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
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
        <Header />
        <main>{children}</main>
        <Footer />
        <NewsletterPopup />
        {/* Scripts globaux */}
        <script src="/js/main.js" defer></script>
        <script src="/js/carousel.js" defer></script>
        <script src="/js/theme-switcher.js" defer></script>
      </body>
    </html>
  );
}
