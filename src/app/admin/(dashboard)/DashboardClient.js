"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for Traffic
const trafficData = [
  { name: 'Jan', uv: 2000 },
  { name: 'Feb', uv: 3000 },
  { name: 'Mar', uv: 2500 },
  { name: 'Apr', uv: 4000 },
  { name: 'May', uv: 3800 },
  { name: 'Jun', uv: 5298 },
  { name: 'Jul', uv: 4800 },
  { name: 'Aug', uv: 6000 },
  { name: 'Sep', uv: 5800 },
  { name: 'Oct', uv: 7000 },
  { name: 'Nov', uv: 6800 },
  { name: 'Dec', uv: 8000 },
];

const earningsData = [
  { name: 'May', value: 2000 },
  { name: 'Jun', value: 4500 },
  { name: 'Jul', value: 1500 },
  { name: 'Aug', value: 3000 },
  { name: 'Sep', value: 2800 },
  { name: 'Oct', value: 5000 },
  { name: 'Nov', value: 4000 },
];

export default function DashboardClient({ initialStats, latestArticles }) {
  const [profile] = useState({ name: "Admin" }); // Should be dynamic based on auth
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (!isMounted) return null; // Avoid hydration mismatch on charts

  return (
    <div style={styles.dashboardContainer}>
      
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.greeting}>Hi {profile.name}, Good Morning!</h1>
          <p style={styles.subtitle}>See your blog statistic summary.</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.searchBar}>
            <i className="fas fa-search" style={{ color: '#9ca3af', marginRight: '10px' }}></i>
            <input type="text" placeholder="Search" style={styles.searchInput} />
          </div>
          <div style={styles.profilePic}>
            <img src="https://ui-avatars.com/api/?name=Admin&background=111827&color=fff" alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        
        {/* Left Column (70%) */}
        <div style={styles.leftCol}>
          
          {/* Traffic Stats (Main Chart) */}
          <div style={styles.mainChartCard}>
            <div style={styles.mainChartHeader}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Traffic Stats</h3>
              <select style={styles.chartSelect}>
                <option>Last 12 month</option>
                <option>Last 30 days</option>
              </select>
            </div>
            <div style={{ height: '250px', marginTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.2)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#e0e7ff', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#e0e7ff', fontSize: 12 }} dx={-10} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="uv" stroke="#fff" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.bottomRow}>
            {/* Latest Post */}
            <div style={styles.card}>
              <div style={styles.cardHeaderFlex}>
                <h3 style={styles.cardTitle}>Latest Post</h3>
                <span style={styles.cardLink}>Last 7 days</span>
              </div>
              <div style={styles.latestPostList}>
                {latestArticles.map(article => (
                  <div key={article.id} style={styles.latestPostItem}>
                    <div style={styles.latestPostImgWrapper}>
                      <img src={article.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=200&auto=format&fit=crop'} alt={article.title} style={styles.latestPostImg} />
                    </div>
                    <div>
                      <div style={styles.latestPostTitle}>{article.title.length > 30 ? article.title.substring(0, 30) + '...' : article.title}</div>
                      <div style={styles.latestPostDate}>{new Date(article.pub_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
                {latestArticles.length === 0 && <p style={{ color: '#6b7280', fontSize: '14px' }}>Aucun article récent.</p>}
              </div>
            </div>

            {/* Platforms */}
            <div style={styles.card}>
              <div style={styles.cardHeaderFlex}>
                <h3 style={styles.cardTitle}>Platforms</h3>
                <span style={styles.cardLink}>Last 7 days</span>
              </div>
              <div style={styles.platformsList}>
                <PlatformBar icon="fa-desktop" name="Desktop" percentage={50} color="#4f46e5" />
                <PlatformBar icon="fa-mobile-alt" name="Mobile" percentage={20} color="#4f46e5" />
                <PlatformBar icon="fa-tablet-alt" name="Tablet" percentage={30} color="#4f46e5" />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (30%) */}
        <div style={styles.rightCol}>
          
          <div style={styles.dateDisplay}>
            {today}
          </div>

          {/* Current Stats */}
          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, textAlign: 'center', marginBottom: '20px' }}>Your Current Stats</h3>
            <div style={styles.statsGrid}>
              <StatSquare icon="fa-eye" color="#4f46e5" bg="#eef2ff" value="2.9m" label="Pageviews" />
              <StatSquare icon="fa-user" color="#f59e0b" bg="#fef3c7" value="872k" label="Visitors" />
              <StatSquare icon="fa-file-alt" color="#ef4444" bg="#fee2e2" value={initialStats.totalArticles} label="Posts" />
              <StatSquare icon="fa-comment" color="#10b981" bg="#d1fae5" value="325" label="Comments" />
            </div>
          </div>

          {/* Earnings (Meta Stats placeholder for now) */}
          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, textAlign: 'center' }}>Meta Reach (Mock)</h3>
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginBottom: '20px' }}>Your Current Reach</p>
            <div style={{ height: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} dx={-5} tickFormatter={(value) => `${value / 1000}k`} width={35} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Sub-components
function PlatformBar({ icon, name, percentage, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
      <div style={{ width: '40px', height: '40px', backgroundColor: '#f8f9fc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, marginRight: '15px' }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{name}</span>
          <span style={{ color: '#6b7280', fontSize: '12px' }}>{percentage}%</span>
        </div>
        <div style={{ width: '100%', backgroundColor: '#f3f4f6', height: '6px', borderRadius: '3px' }}>
          <div style={{ width: `${percentage}%`, backgroundColor: color, height: '100%', borderRadius: '3px' }}></div>
        </div>
      </div>
    </div>
  );
}

function StatSquare({ icon, color, bg, value, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ width: '40px', height: '40px', backgroundColor: bg, color: color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <div style={{ fontWeight: '700', color: '#111827', fontSize: '16px' }}>{value}</div>
        <div style={{ color: '#9ca3af', fontSize: '12px' }}>{label}</div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  dashboardContainer: {
    padding: '10px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px'
  },
  greeting: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 5px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: '8px 16px',
    borderRadius: '20px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    width: '150px'
  },
  profilePic: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  grid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap'
  },
  leftCol: {
    flex: '2 1 600px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  rightCol: {
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  mainChartCard: {
    backgroundColor: '#4f46e5', // Brand Blue
    borderRadius: '16px',
    padding: '30px',
    color: '#fff',
    boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
  },
  mainChartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chartSelect: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '6px',
    outline: 'none',
    fontSize: '12px'
  },
  bottomRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    flex: 1,
    minWidth: '250px'
  },
  cardHeaderFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#111827',
    margin: 0
  },
  cardLink: {
    fontSize: '12px',
    color: '#3b82f6',
    cursor: 'pointer',
    fontWeight: '500'
  },
  latestPostList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  latestPostItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  latestPostImgWrapper: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    overflow: 'hidden',
    flexShrink: 0
  },
  latestPostImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  latestPostTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px'
  },
  latestPostDate: {
    fontSize: '12px',
    color: '#6b7280'
  },
  platformsList: {
    marginTop: '10px'
  },
  dateDisplay: {
    textAlign: 'right',
    fontSize: '14px',
    fontWeight: '500',
    color: '#4b5563',
    paddingRight: '10px',
    paddingBottom: '10px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px 10px'
  }
};
