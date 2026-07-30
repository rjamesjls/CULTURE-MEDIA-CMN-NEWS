import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import DeleteButton from './DeleteButton';

export const revalidate = 0;

export default async function PagesAdminPage() {
  const supabase = await createClient();

  const { data: pages, error } = await supabase
    .from('pages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Erreur: {error.message}</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-heading)', color: '#111827', margin: 0 }}>
          Gestion des Pages
        </h2>
        <Link href="/admin/pages/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus" style={{ marginRight: '8px' }}></i> Nouvelle Page
        </Link>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Lien (Slug)</th>
              <th>Statut</th>
              <th>Date de création</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages && pages.length > 0 ? (
              pages.map((page) => (
                <tr key={page.id}>
                  <td style={{ fontWeight: 500, color: '#111827' }}>{page.title}</td>
                  <td style={{ color: '#6b7280' }}>/{page.slug}</td>
                  <td>
                    <span className={`badge ${page.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                      {page.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td>{new Date(page.created_at).toLocaleDateString('fr-FR')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="admin-action-btn" title="Voir">
                      <i className="fas fa-external-link-alt" style={{ color: '#6b7280' }}></i>
                    </a>
                    <Link href={`/admin/pages/edit/${page.id}`} className="admin-action-btn" title="Modifier">
                      <i className="fas fa-edit" style={{ color: '#3b82f6' }}></i>
                    </Link>
                    <DeleteButton id={page.id} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                  Aucune page créée pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
