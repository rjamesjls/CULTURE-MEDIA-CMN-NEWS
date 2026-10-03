'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MobileSidebarToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
    if (document.body) {
      document.body.classList.remove('admin-sidebar-open');
    }
  }, [pathname]);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      document.body.classList.add('admin-sidebar-open');
    } else {
      document.body.classList.remove('admin-sidebar-open');
    }
  };

  return (
    <>
      <button 
        className="mobile-sidebar-toggle" 
        onClick={toggle}
        aria-label="Toggle Menu"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>
      {isOpen && (
        <div className="mobile-sidebar-overlay" onClick={toggle}></div>
      )}
    </>
  );
}
