'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SocialTabs({ articleId }) {
  const pathname = usePathname();
  
  const tabs = [
    { name: 'Spinoffs', href: `/admin/articles/${articleId}/spinoffs`, icon: 'fa-magic', type: 'fas' },
    { name: 'Instagram', href: `/admin/articles/${articleId}/social`, icon: 'fa-instagram', type: 'fab' },
    { name: 'Facebook', href: `/admin/articles/${articleId}/facebook`, icon: 'fa-facebook', type: 'fab' },
    { name: 'Story', href: `/admin/articles/${articleId}/story`, icon: 'fa-instagram', type: 'fab' },
  ];

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ marginBottom: '15px' }}>
        <Link href="/admin/publication-center" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <i className="fas fa-arrow-left"></i> Retour au Publication Center
        </Link>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {tabs.map(tab => {
          const isActive = pathname === tab.href;
          return (
            <Link 
              key={tab.name} 
              href={tab.href}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: isActive ? '#e41318' : '#f3f4f6',
                color: isActive ? '#fff' : '#4b5563',
                transition: 'all 0.2s'
              }}
            >
              <i className={`${tab.type} ${tab.icon}`}></i> {tab.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
