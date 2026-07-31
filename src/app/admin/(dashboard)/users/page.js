import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import { redirect } from 'next/navigation';
import UserRow from './UserRow';

export default async function UsersPage() {
  const profile = await getUserProfile();
  
  if (!profile || profile.role !== 'admin') {
    redirect('/admin');
  }

  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="admin-content-card">
      <div className="admin-header">
        <h1 className="admin-title">Gestion des utilisateurs</h1>
      </div>

      <div className="admin-table-container" style={{ marginTop: '20px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
