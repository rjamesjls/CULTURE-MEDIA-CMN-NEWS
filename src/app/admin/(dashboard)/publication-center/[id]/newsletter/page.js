import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function NewsletterSenderPage({ params }) {
  const supabase = await createClient();
  const { id } = await params;

  // 1. Récupérer l'article
  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (articleError || !article) {
    notFound();
  }

  // 2. Récupérer le nombre d'abonnés
  const { count: subscriberCount, error: subError } = await supabase
    .from('subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/publication-center" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <i className="fas fa-arrow-left"></i> Retour au Publication Center
        </Link>
      </div>

      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: '#111827', margin: '0 0 10px 0' }}>
            <i className="fas fa-envelope" style={{ color: '#d97706', marginRight: '10px' }}></i>
            Préparer la Newsletter
          </h2>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>
            Diffusez cet article directement dans la boîte mail de vos lecteurs.
          </p>
        </div>
        
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '10px 15px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#b45309' }}>{subscriberCount || 0}</div>
          <div style={{ fontSize: '12px', color: '#d97706', textTransform: 'uppercase', fontWeight: '600' }}>Abonnés Actifs</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* Aperçu de l'email */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#f9fafb', padding: '15px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
            <span style={{ marginLeft: '10px', fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>Aperçu de la boîte de réception</span>
          </div>
          
          <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', display: 'inline-block', width: '60px' }}>De :</span>
              <span style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>AFOLUKUTV &lt;hello@afolukutv.com&gt;</span>
            </div>
            <div>
              <span style={{ fontSize: '13px', color: '#6b7280', display: 'inline-block', width: '60px' }}>Objet :</span>
              <span style={{ fontSize: '14px', color: '#111827', fontWeight: 'bold' }}>Nouvel article : {article.title}</span>
            </div>
          </div>

          <div style={{ padding: '40px 20px', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'center' }}>
            {/* Contenu de l'email (Template) */}
            <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#111827', color: '#fff', padding: '20px', textAlign: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '24px', fontFamily: 'var(--font-heading)', letterSpacing: '2px' }}>AFOLUKUTV</h1>
              </div>
              
              {article.image_url && (
                <img src={article.image_url} alt="Cover" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
              )}
              
              <div style={{ padding: '30px' }}>
                <h2 style={{ marginTop: 0, fontSize: '20px', color: '#111827', lineHeight: '1.4' }}>{article.title}</h2>
                <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.6' }}>
                  {article.description || "Découvrez notre dernier article exclusif sur AFOLUKUTV."}
                </p>
                
                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', backgroundColor: '#d97706', color: '#fff', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none' }}>
                    Lire l'article complet
                  </span>
                </div>
              </div>
              
              <div style={{ backgroundColor: '#f3f4f6', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                Vous recevez cet email car vous êtes abonné à la newsletter de AFOLUKUTV.<br/>
                <a href="#" style={{ color: '#d97706' }}>Se désabonner</a>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            Prêt à envoyer ? L'email sera expédié immédiatement aux <strong>{subscriberCount || 0} abonnés</strong>.
          </p>
          <form action={async () => {
            'use server';
            // Placeholder for real email sending logic
            console.log("Sending newsletter for article ID:", id);
          }}>
            <button 
              type="submit"
              className="admin-btn"
              style={{ backgroundColor: '#d97706', color: '#fff', padding: '12px 24px', fontSize: '16px' }}
            >
              <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i> Envoyer la Newsletter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
