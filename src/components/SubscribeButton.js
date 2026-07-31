'use client';

export default function SubscribeButton() {
  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        window.dispatchEvent(new Event('open-newsletter-popup'));
      }} 
      className="btn btn-primary btn-sm"
      style={{ border: 'none', cursor: 'pointer' }}
    >
      S'abonner
    </button>
  );
}
