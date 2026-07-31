'use client';

import { updateUserRoleAndStatus } from './actions';

export default function UserRow({ user }) {
  return (
    <tr>
      <td style={{ fontWeight: 500, color: '#111827' }}>{user.email}</td>
      <td>
        <form action={updateUserRoleAndStatus} style={{ display: 'inline' }}>
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="status" value={user.status} />
          <select 
            name="role" 
            defaultValue={user.role}
            onChange={(e) => e.target.form.requestSubmit()}
            className={`admin-badge ${user.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}
            style={{ border: 'none', cursor: 'pointer', outline: 'none', paddingRight: '25px', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23111827%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px top 50%', backgroundSize: '8px auto' }}
          >
            <option value="author">Auteur</option>
            <option value="admin">Administrateur</option>
          </select>
        </form>
      </td>
      <td>
        <form action={updateUserRoleAndStatus} style={{ display: 'inline' }}>
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="role" value={user.role} />
          <select 
            name="status" 
            defaultValue={user.status}
            onChange={(e) => e.target.form.requestSubmit()}
            className={`admin-badge ${user.status === 'active' ? 'badge-green' : user.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}
            style={{ border: 'none', cursor: 'pointer', outline: 'none', paddingRight: '25px', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23111827%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px top 50%', backgroundSize: '8px auto' }}
          >
            <option value="pending">En attente</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
          </select>
        </form>
      </td>
      <td>
      </td>
    </tr>
  );
}
