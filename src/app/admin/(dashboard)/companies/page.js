'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setCompanies(data);
    setLoading(false);
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await supabase.from('companies').update({ status: newStatus }).eq('id', id);
    fetchCompanies();
  };

  if (loading) return <div>Chargement des entreprises...</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestion des Entreprises (Portail PRO)</h2>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Nom / SIRET</th>
                  <th>Tier</th>
                  <th>Vérifié</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(company => (
                  <tr key={company.id}>
                    <td>
                      {company.logo_url ? (
                        <img src={company.logo_url} alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', background: '#eee', borderRadius: '8px' }}></div>
                      )}
                    </td>
                    <td>
                      <strong>{company.name}</strong><br/>
                      <small className="text-muted">{company.siret || 'N/A'}</small>
                    </td>
                    <td>
                      {company.tier === 'premium' ? (
                        <span className="badge bg-warning text-dark">Premium</span>
                      ) : (
                        <span className="badge bg-secondary">Gratuit</span>
                      )}
                    </td>
                    <td>
                      {company.is_verified ? '✅ Oui' : '❌ Non'}
                    </td>
                    <td>
                      <span className={`badge bg-${company.status === 'active' ? 'success' : 'danger'}`}>
                        {company.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`btn btn-sm btn-${company.status === 'active' ? 'outline-danger' : 'outline-success'}`}
                        onClick={() => toggleStatus(company.id, company.status)}
                      >
                        {company.status === 'active' ? 'Suspendre' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">Aucune entreprise inscrite.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
