'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { saveProRegistration } from './actions';
import { useRouter } from 'next/navigation';

export default function ProRegisterWizard() {
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Auth States (Step 1)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Skip Step 1 if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setStep(2); // Skip auth step if already logged in
      }
    };
    checkUser();
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'pro' }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      setStep(2);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const formData = new FormData(e.target);
    const result = await saveProRegistration(formData);

    if (result?.error) {
      setErrorMsg(result.error);
      setIsSubmitting(false);
    }
    // if success, the action redirects to /pro/dashboard
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '60px 20px', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* Progress Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ 
              flex: 1, 
              textAlign: 'center', 
              padding: '15px', 
              fontWeight: '600',
              backgroundColor: step === s ? '#f1f5f9' : 'transparent',
              color: step === s ? '#0f172a' : (step > s ? '#10b981' : '#94a3b8'),
              borderBottom: step === s ? '3px solid #0f172a' : '3px solid transparent'
            }}>
              Étape {s}
            </div>
          ))}
        </div>

        <div style={{ padding: '40px' }}>
          {errorMsg && (
            <div style={{ padding: '15px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '25px', fontSize: '14px', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px' }}>Créer votre compte professionnel</h2>
              <p style={{ color: '#64748b', marginBottom: '30px' }}>La première étape consiste à créer vos accès sécurisés.</p>
              
              <form onSubmit={handleAuthSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Adresse email professionnelle</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Mot de passe</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength="6" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Confirmer le mot de passe</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength="6" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '15px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? 'Création en cours...' : 'Continuer vers l\'étape 2'}
                </button>
              </form>
            </div>
          )}

          {/* Form wrapper for step 2 & 3 */}
          {(step === 2 || step === 3) && (
            <form onSubmit={handleFinalSubmit}>
              <div style={{ display: step === 2 ? 'block' : 'none' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px' }}>Vos informations</h2>
                <p style={{ color: '#64748b', marginBottom: '30px' }}>Parlez-nous un peu de vous.</p>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Prénom (facultatif)</label>
                  <input type="text" name="contact_first_name" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nom (facultatif)</label>
                  <input type="text" name="contact_last_name" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Fonction / Poste (facultatif)</label>
                  <input type="text" name="contact_role" placeholder="ex: Gérant, Directeur Marketing" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <button type="button" onClick={() => setStep(3)} style={{ width: '100%', padding: '15px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Continuer vers la dernière étape
                </button>
              </div>

              <div style={{ display: step === 3 ? 'block' : 'none' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px' }}>Profil de l'entreprise</h2>
                <p style={{ color: '#64748b', marginBottom: '30px' }}>Ces informations (gratuites) apparaîtront sur l'annuaire Pro.</p>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nom de l'entreprise *</label>
                  <input type="text" name="name" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                
                <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>N° SIRET *</label>
                    <input type="text" name="siret" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Téléphone *</label>
                    <input type="tel" name="contact_phone" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email de l'entreprise *</label>
                  <input type="email" name="contact_email" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Adresse complète *</label>
                  <input type="text" name="address" required placeholder="N°, rue, code postal, ville" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>

                <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Secteur d'activité *</label>
                    <input type="text" name="industry" required placeholder="ex: BTP, Informatique..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Type d'activité *</label>
                    <select name="business_type" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                      <option value="">Sélectionnez</option>
                      <option value="Produits">Produits</option>
                      <option value="Services">Services</option>
                      <option value="Les deux">Les deux</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description de l'entreprise *</label>
                  <textarea name="description" required rows="4" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}></textarea>
                </div>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button type="button" onClick={() => setStep(2)} style={{ padding: '15px 20px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Retour
                  </button>
                  <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '15px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                    {isSubmitting ? 'Enregistrement...' : 'Valider mon entreprise'}
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
