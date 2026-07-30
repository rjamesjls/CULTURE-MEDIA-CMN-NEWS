import { supabase } from '@/lib/supabase';
import MenuForm from './MenuForm';
import DeleteMenuButton from './DeleteMenuButton';

export const revalidate = 0;

export const metadata = {
  title: 'Gestion des Menus - Admin',
};

export default async function MenusPage() {
  const { data: menus, error } = await supabase
    .from('menus')
    .select('*')
    .order('location', { ascending: true })
    .order('position', { ascending: true });

  const headerMenus = menus?.filter(m => m.location === 'header') || [];
  const footerMenus = menus?.filter(m => m.location === 'footer') || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Gestion des Menus</h2>
      </div>

      <MenuForm />

      <div className="admin-table-container">
        {error ? (
          <p style={{ color: 'red' }}>Erreur: {error.message}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Emplacement</th>
                <th>Position</th>
                <th>Titre</th>
                <th>Lien (URL)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menus?.length > 0 ? (
                <>
                  {headerMenus.map((menu) => (
                    <tr key={menu.id}>
                      <td><span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>En-tête</span></td>
                      <td>{menu.position}</td>
                      <td><strong>{menu.label}</strong></td>
                      <td><span style={{ color: '#6b7280', fontSize: '0.9em' }}>{menu.url}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                          <DeleteMenuButton id={menu.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {footerMenus.map((menu) => (
                    <tr key={menu.id}>
                      <td><span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>Pied de page</span></td>
                      <td>{menu.position}</td>
                      <td><strong>{menu.label}</strong></td>
                      <td><span style={{ color: '#6b7280', fontSize: '0.9em' }}>{menu.url}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                          <DeleteMenuButton id={menu.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    Aucun menu trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
