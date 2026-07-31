import Link from 'next/link';
import NewsletterForm from './NewsletterForm';
import { supabase } from '@/lib/supabase';

export default async function Footer() {
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
            <NewsletterForm />
          </div>

          {/* Rubriques */}
          <div className="footer-section">
            <h4>Rubriques</h4>
            <div className="footer-links">
              {menus?.map((menu) => (
                <Link key={menu.id} href={menu.url} className="footer-link">
                  {menu.label}
                </Link>
              ))}
            </div>
          </div>

          {/* À propos */}
          <div className="footer-section">
            <h4>À propos</h4>
            <div className="footer-links">
              <a href="/about" className="footer-link">Qui sommes-nous</a>
              <a href="/contact" className="footer-link">Contact</a>
              <a href="/all-articles" className="footer-link">Tous les articles</a>
              <Link href="/pro" className="footer-link" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>⭐ Portail des Entreprises (PRO)</Link>
            </div>
          </div>

          {/* Légal */}
          <div className="footer-section">
            <h4>Informations légales</h4>
            <div className="footer-links">
              <a href="/legal" className="footer-link">Mentions légales</a>
              <a href="/legal#privacy" className="footer-link">Politique de confidentialité</a>
              <a href="/legal#cgv" className="footer-link">CGV</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Culture Média News. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
