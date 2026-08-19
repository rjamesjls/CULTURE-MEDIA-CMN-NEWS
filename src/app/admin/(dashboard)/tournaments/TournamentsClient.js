'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function TournamentsClient({ initialTournaments, profile }) {
  const [tournaments, setTournaments] = useState(initialTournaments);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black font-heading text-white tracking-tight uppercase">Tournois & Matchs</h1>
          <p className="text-gray-400 mt-2 text-sm font-medium">Gérez vos compétitions et générez des visuels instantanés.</p>
        </div>
        <Link href="/admin/tournaments/new" className="admin-btn admin-btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Nouveau Tournoi
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <p className="text-gray-400">Aucun tournoi pour le moment.</p>
            <Link href="/admin/tournaments/new" className="text-blue-400 hover:text-blue-300 font-bold mt-2 inline-block">Créer le premier tournoi</Link>
          </div>
        ) : (
          tournaments.map(tournament => (
            <div key={tournament.id} className="bg-[#12121A] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 text-[10px] font-black tracking-widest uppercase rounded ${tournament.status === 'ongoing' ? 'bg-green-500/20 text-green-400' : tournament.status === 'finished' ? 'bg-gray-500/20 text-gray-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {tournament.status === 'ongoing' ? 'En cours' : tournament.status === 'finished' ? 'Terminé' : 'Brouillon'}
                  </span>
                  <span className="text-gray-500 text-xs font-bold">{new Date(tournament.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">{tournament.name}</h3>
                <p className="text-gray-400 text-sm font-medium">{tournament.sport} - {tournament.season}</p>
              </div>
              <div className="mt-6 flex gap-2">
                <Link href={`/admin/tournaments/${tournament.id}`} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-center py-2 rounded-lg text-sm font-bold transition-colors">Gérer</Link>
                <Link href={`/admin/tournaments/${tournament.id}/visuals`} className="flex-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-center py-2 rounded-lg text-sm font-bold transition-colors">Visuels</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
