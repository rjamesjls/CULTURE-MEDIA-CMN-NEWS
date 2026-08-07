import Link from 'next/link';

export const metadata = {
  title: 'Politique de confidentialité — Culture Média News',
  description: 'Politique de confidentialité et traitement des données personnelles de Culture Média News (CMN).',
};

export default function PrivacyPage() {
  const lastUpdated = '8 août 2025';
  const companyName = 'Culture Média News (CMN)';
  const companyEmail = 'contact@culturemedianews.fr';
  const websiteUrl = 'https://culturemedianews.fr';
  const dpoEmail = 'dpo@culturemedianews.fr';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px', fontFamily: 'Georgia, serif', color: '#1f2937', lineHeight: '1.8' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #dc2626', paddingBottom: '24px', marginBottom: '40px' }}>
        <Link href="/" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          ← Retour au site
        </Link>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0', fontFamily: 'system-ui, sans-serif' }}>
          Politique de confidentialité
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '14px', fontFamily: 'system-ui, sans-serif' }}>
          Dernière mise à jour : {lastUpdated}
        </p>
      </div>

      {/* Intro */}
      <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '20px', marginBottom: '40px', fontSize: '15px' }}>
        <strong style={{ fontFamily: 'system-ui, sans-serif' }}>Résumé :</strong> Culture Média News collecte uniquement les données nécessaires 
        au fonctionnement de la plateforme. Nous ne vendons jamais vos données. 
        Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression.
      </div>

      <Section title="1. Responsable du traitement">
        <p>
          Le responsable du traitement des données personnelles est :<br />
          <strong>{companyName}</strong><br />
          Site web : <a href={websiteUrl} style={{ color: '#dc2626' }}>{websiteUrl}</a><br />
          Contact : <a href={`mailto:${companyEmail}`} style={{ color: '#dc2626' }}>{companyEmail}</a><br />
          DPO : <a href={`mailto:${dpoEmail}`} style={{ color: '#dc2626' }}>{dpoEmail}</a>
        </p>
      </Section>

      <Section title="2. Données collectées">
        <p>Dans le cadre de nos services, nous collectons les données suivantes :</p>
        
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'system-ui, sans-serif', color: '#111827', marginTop: '16px' }}>
          a) Données d&apos;identification et de compte
        </h3>
        <ul>
          <li>Nom, prénom, adresse e-mail</li>
          <li>Identifiants de connexion (mot de passe chiffré)</li>
          <li>Rôle et permissions dans la plateforme CMN OS</li>
        </ul>

        <h3 style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'system-ui, sans-serif', color: '#111827', marginTop: '16px' }}>
          b) Données d&apos;utilisation
        </h3>
        <ul>
          <li>Logs de connexion (adresse IP, horodatage, navigateur)</li>
          <li>Actions effectuées sur la plateforme (articles créés, vidéos publiées)</li>
          <li>Données analytiques de navigation (via Google Analytics, anonymisées)</li>
        </ul>

        <h3 style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'system-ui, sans-serif', color: '#111827', marginTop: '16px' }}>
          c) Tokens d&apos;accès aux réseaux sociaux
        </h3>
        <ul>
          <li>Tokens OAuth TikTok, Instagram, Facebook (chiffrés en base de données)</li>
          <li>Identifiants de compte des plateformes connectées</li>
          <li>Ces tokens ne sont jamais partagés avec des tiers</li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', fontFamily: 'system-ui, sans-serif' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Finalité</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Base légale</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Durée</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Gestion des comptes utilisateurs', 'Contrat', '3 ans après clôture'],
              ['Publication sur les réseaux sociaux', 'Intérêt légitime', 'Durée du token OAuth'],
              ['Sécurité et logs', 'Obligation légale', '12 mois'],
              ['Analyse d\'audience', 'Consentement', 'Jusqu\'au retrait'],
            ].map(([fin, base, duree], i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px' }}>{fin}</td>
                <td style={{ padding: '10px' }}>{base}</td>
                <td style={{ padding: '10px' }}>{duree}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="4. Intégration TikTok — données spécifiques">
        <p>
          Dans le cadre de l&apos;intégration avec l&apos;API TikTok (<em>Content Posting API</em>), 
          CMN OS collecte et traite les données suivantes pour le compte des utilisateurs autorisés :
        </p>
        <ul>
          <li><strong>Token d&apos;accès OAuth TikTok</strong> : utilisé uniquement pour publier des vidéos sur le compte TikTok autorisé</li>
          <li><strong>Identifiant utilisateur TikTok (open_id)</strong> : pour identifier le compte connecté</li>
          <li><strong>Métadonnées de publication</strong> : titre, description, statut de publication</li>
        </ul>
        <p>
          Ces données ne sont utilisées qu&apos;aux fins de publication et ne sont jamais 
          partagées avec des tiers ni utilisées à des fins publicitaires. 
          Vous pouvez révoquer l&apos;accès à tout moment depuis votre compte TikTok 
          (Paramètres → Applications connectées).
        </p>
        <p>
          Cette intégration est soumise à la 
          <a href="https://www.tiktok.com/legal/page/global/privacy-policy/en" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626' }}> Politique de confidentialité TikTok</a>.
        </p>
      </Section>

      <Section title="5. Partage des données">
        <p>Nous ne vendons jamais vos données personnelles. Nous pouvons les partager avec :</p>
        <ul>
          <li><strong>Supabase</strong> : hébergement de la base de données (EU)</li>
          <li><strong>Vercel</strong> : hébergement de l&apos;application (EU)</li>
          <li><strong>Google Analytics</strong> : analyse d&apos;audience (données anonymisées)</li>
          <li><strong>Meta (Instagram/Facebook)</strong> : uniquement pour la publication de contenu autorisé</li>
          <li><strong>TikTok</strong> : uniquement pour la publication de contenu autorisé</li>
        </ul>
        <p>
          Tous nos sous-traitants respectent le RGPD et ont signé des accords de traitement 
          des données (DPA) conformes à la réglementation européenne.
        </p>
      </Section>

      <Section title="6. Vos droits (RGPD)">
        <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Droit d&apos;accès</strong> : obtenir une copie de vos données personnelles</li>
          <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
          <li><strong>Droit à l&apos;effacement</strong> : demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Droit d&apos;opposition</strong> : vous opposer à certains traitements</li>
          <li><strong>Droit de limitation</strong> : limiter le traitement de vos données</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez notre DPO : {' '}
          <a href={`mailto:${dpoEmail}`} style={{ color: '#dc2626' }}>{dpoEmail}</a>.
          Nous répondrons dans un délai de 30 jours.
        </p>
        <p>
          Vous pouvez également adresser une réclamation à la <strong>CNIL</strong> : {' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626' }}>www.cnil.fr</a>
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>Nous utilisons les cookies suivants :</p>
        <ul>
          <li><strong>Cookies essentiels</strong> : session de connexion, sécurité (ne peuvent pas être refusés)</li>
          <li><strong>Cookies analytiques</strong> : Google Analytics (nécessitent votre consentement)</li>
        </ul>
        <p>
          Vous pouvez gérer vos préférences de cookies à tout moment depuis les paramètres de votre navigateur.
        </p>
      </Section>

      <Section title="8. Sécurité">
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour 
          protéger vos données :
        </p>
        <ul>
          <li>Chiffrement HTTPS (TLS 1.3) sur toutes les communications</li>
          <li>Tokens OAuth chiffrés en base de données</li>
          <li>Accès restreint aux données par rôles et permissions</li>
          <li>Journaux d&apos;audit des accès aux données sensibles</li>
          <li>Mises à jour de sécurité régulières</li>
        </ul>
      </Section>

      <Section title="9. Modifications">
        <p>
          Cette politique peut être mise à jour pour refléter les évolutions de nos pratiques 
          ou des obligations légales. En cas de modification substantielle, nous vous en 
          informerons par e-mail au moins 30 jours avant l&apos;entrée en vigueur.
        </p>
      </Section>

      {/* Footer */}
      <div style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '24px', fontSize: '14px', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
        <Link href="/terms" style={{ color: '#dc2626', textDecoration: 'none' }}>Conditions d&apos;utilisation</Link>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>culturemedianews.fr</Link>
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
