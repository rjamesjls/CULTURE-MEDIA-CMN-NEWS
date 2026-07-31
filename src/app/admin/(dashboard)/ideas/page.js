import { getIdeas } from './actions';
import IdeasClient from './IdeasClient';

export const metadata = {
  title: 'Idées de contenu | CMN Admin',
};

export default async function IdeasPage() {
  const initialIdeas = await getIdeas();

  return (
    <div className="admin-content" style={{ maxWidth: '100vw', padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="admin-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>
            <i className="fas fa-lightbulb" style={{ color: '#fbbf24', marginRight: '10px' }}></i>
            Idées de contenu
          </h1>
          <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Gérez vos idées et transformez-les en articles ou posts IA.</p>
        </div>
      </div>

      <IdeasClient initialIdeas={initialIdeas} />
    </div>
  );
}
