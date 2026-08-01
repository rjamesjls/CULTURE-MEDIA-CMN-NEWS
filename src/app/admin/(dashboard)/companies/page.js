'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { deleteCompany } from './actions';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDeleteClick = (company) => {
    setCompanyToDelete(company);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    const result = await deleteCompany(companyToDelete.id);
    if (result.error) {
      alert('Erreur lors de la suppression : ' + result.error);
    } else {
      fetchCompanies();
    }
    setIsDeleting(false);
    setCompanyToDelete(null);
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
                    <td style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className={`btn btn-sm btn-${company.status === 'active' ? 'outline-warning' : 'outline-success'}`}
                        onClick={() => toggleStatus(company.id, company.status)}
                      >
                        {company.status === 'active' ? 'Suspendre' : 'Activer'}
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteClick(company)}
                      >
                        Supprimer
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

      {/* Delete Confirmation Modal */}
      {companyToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#0F172A', fontWeight: '800', fontSize: '20px' }}>Confirmer la suppression</h3>
            <p style={{ color: '#475569', marginBottom: '25px', lineHeight: '1.5', fontSize: '15px' }}>
              Êtes-vous sûr de vouloir supprimer définitivement l'entreprise <strong>{companyToDelete.name}</strong> ? Cette action est irréversible et supprimera le compte pro de cet utilisateur.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                className="btn btn-light" 
                onClick={() => setCompanyToDelete(null)} 
                disabled={isDeleting}
                style={{ fontWeight: '600' }}
              >
                Annuler
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmDelete} 
                disabled={isDeleting}
                style={{ fontWeight: '600', backgroundColor: 'var(--color-primary, #D32F2F)' }}
              >
                {isDeleting ? 'Suppression...' : 'Oui, supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
