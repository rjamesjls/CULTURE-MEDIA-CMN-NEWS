import Link from 'next/link';

export const metadata = {
  title: 'Conditions d\'utilisation — Culture Média News',
  description: 'Conditions générales d\'utilisation de la plateforme Culture Média News (CMN).',
};

export default function TermsPage() {
  const lastUpdated = '8 août 2025';
  const companyName = 'Culture Média News (CMN)';
  const companyEmail = 'contact@culturemedia.news';
  const websiteUrl = 'https://culturemedia.news';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px', fontFamily: 'Georgia, serif', color: '#1f2937', lineHeight: '1.8' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #dc2626', paddingBottom: '24px', marginBottom: '40px' }}>
        <Link href="/" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          ← Retour au site
        </Link>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0', fontFamily: 'system-ui, sans-serif' }}>
          Conditions d&apos;utilisation
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '14px', fontFamily: 'system-ui, sans-serif' }}>
          Dernière mise à jour : {lastUpdated}
        </p>
      </div>

      <Section title="1. Présentation de la plateforme">
        <p>
          {companyName} (ci-après « CMN », « nous », « notre ») exploite la plateforme éditoriale disponible 
          à l&apos;adresse <a href={websiteUrl} style={{ color: '#dc2626' }}>{websiteUrl}</a> ainsi que 
          ses outils associés, dont CMN OS, un système de gestion et de publication de contenu 
          à destination des équipes éditoriales.
        </p>
        <p>
          En accédant à nos services, vous acceptez les présentes conditions d&apos;utilisation dans leur intégralité. 
          Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser nos services.
        </p>
      </Section>

      <Section title="2. Utilisation des services">
        <p>Nos services sont destinés à un usage éditorial et journalistique. En utilisant CMN OS, vous vous engagez à :</p>
        <ul>
          <li>Utiliser la plateforme uniquement dans un cadre professionnel et éditorial autorisé</li>
          <li>Ne pas publier de contenu illégal, diffamatoire, haineux ou portant atteinte à des droits de tiers</li>
          <li>Respecter les droits d&apos;auteur et droits voisins sur tous les contenus publiés</li>
          <li>Maintenir la confidentialité de vos identifiants de connexion</li>
          <li>Ne pas tenter de contourner les mesures de sécurité de la plateforme</li>
        </ul>
      </Section>

      <Section title="3. Intégrations avec des plateformes tierces">
        <p>
          CMN OS intègre des API de plateformes tierces (TikTok, Instagram, Facebook) pour permettre 
          la publication directe de contenu. En utilisant ces fonctionnalités, vous reconnaissez que :
        </p>
        <ul>
          <li>Vous êtes soumis aux conditions d&apos;utilisation de ces plateformes tierces</li>
          <li>CMN n&apos;est pas responsable des modifications apportées par ces plateformes à leurs APIs ou politiques</li>
          <li>Vous devez disposer des droits nécessaires sur les contenus publiés</li>
          <li>La publication est effectuée sous votre responsabilité éditoriale</li>
        </ul>
        <p>
          En particulier, pour TikTok, l&apos;utilisation de notre intégration est soumise aux 
          <a href="https://www.tiktok.com/legal/page/global/terms-of-service/en" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626' }}> Conditions d&apos;utilisation TikTok</a> et 
          aux <a href="https://developers.tiktok.com/doc/overview" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626' }}> Règles pour développeurs TikTok</a>.
        </p>
      </Section>

      <Section title="4. Propriété intellectuelle">
        <p>
          L&apos;ensemble des contenus produits par {companyName} (articles, vidéos, graphiques, logo CMN) 
          sont protégés par le droit de la propriété intellectuelle. Toute reproduction, diffusion 
          ou exploitation sans autorisation préalable est interdite.
        </p>
        <p>
          Les contenus publiés par les utilisateurs via CMN OS restent la propriété de leurs auteurs. 
          En les publiant via notre plateforme, vous accordez à {companyName} une licence d&apos;utilisation 
          non exclusive pour les afficher et les diffuser dans le cadre de nos services.
        </p>
      </Section>

      <Section title="5. Limitation de responsabilité">
        <p>
          {companyName} s&apos;efforce d&apos;assurer la disponibilité et la fiabilité de ses services 
          mais ne peut garantir leur fonctionnement ininterrompu. Nous ne saurions être tenus 
          responsables des dommages résultant de :
        </p>
        <ul>
          <li>L&apos;indisponibilité temporaire de nos services ou des APIs tierces</li>
          <li>La perte de données liée à une défaillance technique</li>
          <li>L&apos;utilisation inappropriée de la plateforme par un utilisateur</li>
          <li>Des modifications apportées par des plateformes tierces à leurs conditions ou APIs</li>
        </ul>
      </Section>

      <Section title="6. Modifications des conditions">
        <p>
          {companyName} se réserve le droit de modifier les présentes conditions à tout moment. 
          Les utilisateurs seront informés des modifications importantes par e-mail ou via 
          la plateforme. La poursuite de l&apos;utilisation des services après notification 
          vaut acceptation des nouvelles conditions.
        </p>
      </Section>

      <Section title="7. Droit applicable">
        <p>
          Les présentes conditions sont soumises au droit français. En cas de litige, 
          les parties s&apos;engagent à rechercher une solution amiable avant tout recours judiciaire. 
          À défaut, les tribunaux compétents de Paris seront seuls compétents.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          Pour toute question relative aux présentes conditions, contactez-nous à :<br />
          <strong>{companyName}</strong><br />
          E-mail : <a href={`mailto:${companyEmail}`} style={{ color: '#dc2626' }}>{companyEmail}</a><br />
          Site web : <a href={websiteUrl} style={{ color: '#dc2626' }}>{websiteUrl}</a>
        </p>
      </Section>

      {/* Footer */}
      <div style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '24px', fontSize: '14px', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
        <Link href="/privacy" style={{ color: '#dc2626', textDecoration: 'none' }}>Politique de confidentialité</Link>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>culturemedia.news</Link>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', fontFamily: 'system-ui, sans-serif', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
        {title}
      </h2>
      <div style={{ fontSize: '16px', color: '#374151' }}>
        {children}
      </div>
    </div>
  );
}
