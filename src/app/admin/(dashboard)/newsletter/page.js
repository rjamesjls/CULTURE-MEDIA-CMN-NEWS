import { createClient } from '@/utils/supabase/server';

export const revalidate = 0;

export default async function NewsletterAdminPage() {
  const supabase = await createClient();

  const { data: subscribers, error } = await supabase
    .from('subscribers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Erreur lors de la récupération des abonnés : {error.message}</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-heading)', color: '#111827', margin: 0 }}>
          Abonnés Newsletter ({subscribers?.length || 0})
        </h2>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Statut</th>
              <th>Date d'inscription</th>
            </tr>
          </thead>
          <tbody>
            {subscribers?.length > 0 ? (
              subscribers.map((sub) => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 500, color: '#111827' }}>{sub.email}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '2px 8px', fontSize: '12px', borderRadius: '4px' }}>
                      {sub.status === 'active' ? 'Actif' : sub.status}
                    </span>
                  </td>
                  <td>{new Date(sub.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                  Aucun abonné pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
