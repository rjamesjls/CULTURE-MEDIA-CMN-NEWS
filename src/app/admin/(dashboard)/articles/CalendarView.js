'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CalendarView({ articles }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  // Adjust for Monday as first day of week
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Group articles by date
  const articlesByDate = {};
  articles.forEach(article => {
    const d = new Date(article.pub_date);
    const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!articlesByDate[dateStr]) {
      articlesByDate[dateStr] = [];
    }
    articlesByDate[dateStr].push(article);
  });

  const renderCells = () => {
    const cells = [];
    
    // Empty cells before start of month
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} style={{ padding: '10px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}></div>);
    }

    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${i}`;
      const dayArticles = articlesByDate[dateStr] || [];
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toDateString();

      cells.push(
        <div key={`day-${i}`} style={{ 
          padding: '10px', 
          backgroundColor: isToday ? '#eff6ff' : '#fff', 
          border: '1px solid #e5e7eb',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ 
              fontWeight: isToday ? 'bold' : 'normal', 
              color: isToday ? '#2563eb' : '#374151',
              backgroundColor: isToday ? '#dbeafe' : 'transparent',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {i}
            </span>
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>
              {dayArticles.length > 0 && `${dayArticles.length} art.`}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1 }}>
            {dayArticles.map(article => (
              <Link 
                key={article.id} 
                href={`/admin/articles/edit/${article.id}`}
                style={{ 
                  fontSize: '11px', 
                  backgroundColor: article.status === 'published' ? '#dcfce7' : (article.status === 'pending' ? '#ffedd5' : '#fef3c7'),
                  color: article.status === 'published' ? '#166534' : (article.status === 'pending' ? '#9a3412' : '#92400e'),
                  padding: '4px 6px', 
                  borderRadius: '4px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block'
                }}
                title={article.title}
              >
                {article.title}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d1d5db', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button onClick={nextMonth} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f3f4f6' }}>
            {day}
          </div>
        ))}
        {renderCells()}
      </div>
    </div>
  );
}
