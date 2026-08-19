'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function NewTournamentClient({ profile }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sport: 'football',
    season: new Date().getFullYear().toString(),
    status: 'draft'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: submitError } = await supabase
      .from('tournaments')
      .insert([formData])
      .select()
      .single();

    if (submitError) {
      setError(submitError.message);
      setLoading(false);
    } else {
      router.push(`/admin/tournaments/${data.id}`);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link href="/admin/tournaments" className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Retour aux tournois
        </Link>
        <h1 className="text-3xl font-black font-heading text-white tracking-tight uppercase">Créer un Tournoi</h1>
      </div>

      <div className="bg-[#12121A] border border-white/10 rounded-xl p-6">
        {error && <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm font-bold">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">Nom du Tournoi</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              placeholder="Ex: Ligue des Champions 2024"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">Sport</label>
              <select 
                name="sport" 
                value={formData.sport} 
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium appearance-none"
              >
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
                <option value="rugby">Rugby</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">Saison</label>
              <input 
                type="text" 
                name="season" 
                value={formData.season} 
                onChange={handleChange} 
                required 
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                placeholder="Ex: 2023-2024"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">Statut</label>
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium appearance-none"
            >
              <option value="draft">Brouillon (Configuration)</option>
              <option value="ongoing">En cours (Actif)</option>
              <option value="finished">Terminé</option>
            </select>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full admin-btn admin-btn-primary py-4 text-lg"
            >
              {loading ? 'Création...' : 'Créer le Tournoi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
