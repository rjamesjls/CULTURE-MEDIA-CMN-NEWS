import PageForm from '../PageForm';

export default function NewPage() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-heading)', color: '#111827', marginBottom: '20px' }}>
        Créer une nouvelle page
      </h2>
      <PageForm />
    </div>
  );
}
