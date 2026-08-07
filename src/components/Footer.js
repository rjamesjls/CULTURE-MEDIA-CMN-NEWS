import Link from 'next/link';
import NewsletterForm from './NewsletterForm';
import { supabase } from '@/lib/supabase';
import { getDictionary } from '@/i18n/dictionaries';

export default async function Footer({ lang = 'fr' }) {
  const dict = await getDictionary(lang);

  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .eq('location', 'footer')
    .order('position', { ascending: true });

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* About */}
          <div className="footer-section">
            <h4>Culture Média News</h4>
            <p style={{ color: 'var(--color-gray-400)', marginBottom: 'var(--space-3)' }}>
              Votre source d'actualité culturelle et locale. News, événements, tendances et breaking news.
            </p>
            <div className="social-icons">
              <a href="#" className="social-icon" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-icon" aria-label="YouTube">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
            <NewsletterForm 
              title={dict.nav.newsletter}
              description={dict.newsletter?.description || "Restez informé de nos derniers articles"}
              placeholder={dict.newsletter?.placeholder || "Votre adresse email"}
              buttonText={dict.newsletter?.buttonText || "S'abonner"}
              buttonSubmitting={dict.newsletter?.buttonSubmitting || "Inscription..."}
            />
          </div>

          {/* Rubriques */}
          <div className="footer-section">
            <h4>Rubriques</h4>
            <div className="footer-links">
              {menus?.map((menu) => (
                <Link key={menu.id} href={`/${lang}${menu.url === '/' ? '' : menu.url}`} className="footer-link">
                  {menu.label}
                </Link>
              ))}
            </div>
          </div>

          {/* À propos */}
          <div className="footer-section">
            <h4>{dict.footer.about}</h4>
            <div className="footer-links">
              <Link href={`/${lang}/about`} className="footer-link">Qui sommes-nous</Link>
              <Link href={`/${lang}/contact`} className="footer-link">{dict.nav.contact}</Link>
              <Link href={`/${lang}/all-articles`} className="footer-link">Tous les articles</Link>
              <Link href={`/${lang}/pro`} className="footer-link" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>⭐ {dict.nav.pro}</Link>
            </div>
          </div>

          {/* Légal */}
          <div className="footer-section">
            <h4>{dict.footer.legal}</h4>
            <div className="footer-links">
              <Link href={`/${lang}/legal`} className="footer-link">{dict.footer.legal}</Link>
              <Link href={`/${lang}/legal#privacy`} className="footer-link">{dict.footer.privacy}</Link>
              <Link href={`/${lang}/legal#cgv`} className="footer-link">CGV</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Culture Média News. {dict.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
