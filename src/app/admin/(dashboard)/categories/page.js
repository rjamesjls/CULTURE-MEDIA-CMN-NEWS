import { supabase } from '@/lib/supabase';
import CategoryForm from './CategoryForm';
import DeleteCategoryButton from './DeleteCategoryButton';

export const revalidate = 0; // Don't cache admin pages

export const metadata = {
  title: 'Gestion des Catégories - Admin',
};

export default async function CategoriesPage() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Gestion des Catégories</h2>
      </div>

      <CategoryForm />

      <div className="admin-table-container">
        {error ? (
          <p style={{ color: 'red' }}>Erreur: {error.message}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom de la catégorie</th>
                <th>Slug (URL)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories?.length > 0 ? (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.id}</td>
                    <td><strong>{cat.name}</strong></td>
                    <td><span style={{ color: '#6b7280', fontSize: '0.9em' }}>{cat.slug}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                        <DeleteCategoryButton id={cat.id} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                    Aucune catégorie trouvée.
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
