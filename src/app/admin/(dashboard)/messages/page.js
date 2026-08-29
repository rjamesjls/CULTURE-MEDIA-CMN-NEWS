import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Messages de contact | A FOLUKU TV Admin',
};

export default async function MessagesPage() {
  const supabase = await createClient();
  
  // Vérification de l'authentification (si la session existe et est admin, généralement fait dans le layout ou middleware)
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/admin/login');
  }

  // Récupérer les messages, triés par date la plus récente
  const { data: messages, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des messages:', error.message);
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Messages de contact</h1>
        <p>Consultez les messages envoyés via le formulaire de contact du site.</p>
      </div>

      <div className="admin-content">
        {error ? (
          <div className="error-message">
            <p>Erreur: Impossible de charger les messages.</p>
            <p className="text-sm">{error.message}</p>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="empty-state">
            <p>Aucun message de contact reçu pour le moment.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expéditeur</th>
                  <th>Email</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id} style={{ backgroundColor: msg.read ? 'transparent' : 'rgba(var(--color-primary-rgb), 0.05)' }}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td><strong>{msg.first_name} {msg.last_name}</strong></td>
                    <td><a href={`mailto:${msg.email}`} className="admin-link">{msg.email}</a></td>
                    <td>
                      <div style={{ 
                        maxHeight: '100px', 
                        overflowY: 'auto', 
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.9rem',
                        padding: '8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        {msg.message}
                      </div>
                      {msg.file_url && (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="admin-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                            <i className="fas fa-eye"></i> Voir
                          </a>
                          <a href={`${msg.file_url}?download`} download className="admin-btn-secondary" style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', 
                            padding: '4px 10px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', 
                            borderRadius: '4px', color: '#374151', textDecoration: 'none' 
                          }}>
                            <i className="fas fa-download"></i> Télécharger
                          </a>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .admin-page { padding: 20px; }
        .admin-header { margin-bottom: 30px; }
        .admin-header h1 { font-size: 2rem; margin-bottom: 10px; font-family: var(--font-heading); }
        .admin-header p { color: #6b7280; }
        .table-container { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th, .admin-table td { padding: 16px; border-bottom: 1px solid #e5e7eb; }
        .admin-table th { background-color: #f9fafb; font-weight: 600; color: #374151; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .admin-table tbody tr:hover { background-color: #f9fafb; }
        .admin-link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
        .admin-link:hover { text-decoration: underline; }
        .error-message { padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b; }
        .empty-state { padding: 40px; text-align: center; background: white; border-radius: 12px; border: 1px dashed #d1d5db; color: #6b7280; }
      `}</style>
    </div>
  );
}
