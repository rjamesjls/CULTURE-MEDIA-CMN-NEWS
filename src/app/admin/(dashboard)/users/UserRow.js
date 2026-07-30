'use client';

import { updateUserRoleAndStatus } from './actions';

export default function UserRow({ user }) {
  return (
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      <td style={{ padding: '12px' }}>{user.email}</td>
      <td style={{ padding: '12px' }}>
        <form action={updateUserRoleAndStatus} style={{ display: 'inline' }}>
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="status" value={user.status} />
          <select 
            name="role" 
            defaultValue={user.role}
            onChange={(e) => e.target.form.requestSubmit()}
            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="author">Auteur</option>
            <option value="admin">Administrateur</option>
          </select>
        </form>
      </td>
      <td style={{ padding: '12px' }}>
        <form action={updateUserRoleAndStatus} style={{ display: 'inline' }}>
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="role" value={user.role} />
          <select 
            name="status" 
            defaultValue={user.status}
            onChange={(e) => e.target.form.requestSubmit()}
            style={{ 
              padding: '6px', 
              borderRadius: '4px', 
              border: '1px solid #d1d5db',
              backgroundColor: user.status === 'active' ? '#dcfce7' : user.status === 'pending' ? '#fef08a' : '#fee2e2'
            }}
          >
            <option value="pending">En attente</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
          </select>
        </form>
      </td>
      <td style={{ padding: '12px' }}>
      </td>
    </tr>
  );
}
