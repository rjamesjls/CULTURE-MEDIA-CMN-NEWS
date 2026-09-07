'use client';

import React, { useState, useEffect, useCallback } from 'react';

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export default function CreatorsChartsClient() {
  const [creators, setCreators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtres
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all_time');
  const [sortBy, setSortBy] = useState('followers'); 

  // Ajout
  const [addUsername, setAddUsername] = useState('');
  const [addPlatform, setAddPlatform] = useState('tiktok');
  const [addCountry, setAddCountry] = useState('Guyane');
  const [isAdding, setIsAdding] = useState(false);
  const [addMessage, setAddMessage] = useState(null);

  const fetchCharts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/creators/charts?period=${filterPeriod}&country=${filterCountry}&platform=${filterPlatform}&sort=${sortBy}`);
      const data = await res.json();
      if (data.success) {
        setCreators(data.data || []);
      }
    } catch (error) {
      console.error("Erreur fetch creators:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterPeriod, filterCountry, filterPlatform, sortBy]);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addUsername.trim()) return;

    setIsAdding(true);
    setAddMessage(null);
    
    try {
      const res = await fetch('/api/creators/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: addUsername, platform: addPlatform, country: addCountry })
      });
      const data = await res.json();
      
      if (data.success) {
        setAddUsername('');
        setAddMessage({ type: 'success', text: `${data.creator.username} ajouté avec succès !` });
        fetchCharts();
      } else {
        setAddMessage({ type: 'error', text: data.error || 'Erreur lors de l\'ajout' });
      }
    } catch (error) {
      setAddMessage({ type: 'error', text: 'Erreur réseau' });
    } finally {
      setIsAdding(false);
    }
  };

  const totalFollowers = creators.reduce((sum, c) => sum + (c.current_followers || 0), 0);
  const totalGrowth = creators.reduce((sum, c) => sum + (c.followers_gained || 0), 0);

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      {/* Colonne Principale */}
      <div className="flex-1 flex flex-col gap-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#100d23] border border-[#2d295a] rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-gray-400 text-sm font-medium mb-1 relative z-10">Créateurs Suivis</h3>
            <div className="text-3xl font-bold text-white relative z-10">{creators.length} Total</div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
          </div>
          
          <div className="bg-[#100d23] border border-[#2d295a] rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-gray-400 text-sm font-medium mb-1 relative z-10">Volume d'abonnés</h3>
            <div className="text-3xl font-bold text-white relative z-10">{formatNumber(totalFollowers)}</div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-[#100d23] border border-[#2d295a] rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-gray-400 text-sm font-medium mb-1 relative z-10">Croissance (Abonnés)</h3>
            <div className="text-3xl font-bold text-[#10b981] relative z-10">+{formatNumber(totalGrowth)}</div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center bg-[#18153a] border border-[#2d295a] rounded-xl overflow-hidden">
            <select 
              value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}
              className="px-4 py-2.5 text-sm bg-transparent text-gray-300 outline-none cursor-pointer"
            >
              <option value="all">Toutes plateformes</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          <div className="flex items-center bg-[#18153a] border border-[#2d295a] rounded-xl overflow-hidden">
            <select 
              value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}
              className="px-4 py-2.5 text-sm bg-transparent text-gray-300 outline-none cursor-pointer"
            >
              <option value="all">Tous les pays</option>
              <option value="Guyane">Guyane</option>
              <option value="Suriname">Suriname</option>
              <option value="Martinique">Martinique</option>
              <option value="Guadeloupe">Guadeloupe</option>
              <option value="International">International</option>
            </select>
          </div>
          <div className="flex items-center bg-[#18153a] border border-[#2d295a] rounded-xl overflow-hidden">
            <select 
              value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-2.5 text-sm bg-transparent text-gray-300 outline-none cursor-pointer"
            >
              <option value="7_days">7 Derniers Jours</option>
              <option value="30_days">30 Derniers Jours</option>
              <option value="all_time">Global</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#100d23] border border-[#2d295a] rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-[#2d295a] flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-3">
              <i className="fas fa-trophy text-yellow-500"></i>
              Classement des Créateurs
            </h2>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center text-gray-400">
                <i className="fas fa-circle-notch fa-spin text-3xl mb-4"></i>
                <p>Chargement des classements...</p>
              </div>
            ) : creators.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <i className="fas fa-users text-4xl mb-4 opacity-50"></i>
                <p>Aucun créateur trouvé pour ces filtres.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#18153a] text-xs uppercase tracking-wider text-gray-400 border-b border-[#2d295a]">
                    <th className="py-4 px-6 font-medium">Rang</th>
                    <th className="py-4 px-6 font-medium">Créateur</th>
                    <th className="py-4 px-6 font-medium">Plateforme</th>
                    <th className="py-4 px-6 font-medium text-right">Abonnés</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((creator, idx) => (
                    <tr key={creator.id} className="border-b border-[#2d295a]/50 hover:bg-[#18153a]/50 transition-colors">
                      <td className="py-4 px-6 text-white font-bold">#{idx + 1}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#18153a] overflow-hidden flex-shrink-0 border border-[#2d295a]">
                            {creator.profile_picture_url ? (
                              <img src={creator.profile_picture_url} alt={creator.username} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                                {creator.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">@{creator.username}</div>
                            <div className="text-xs text-gray-400">{creator.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${creator.platform === 'tiktok' ? 'bg-black text-white border border-gray-700' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white'}`}>
                          {creator.platform === 'tiktok' ? <i className="fab fa-tiktok mr-1"></i> : <i className="fab fa-instagram mr-1"></i>}
                          {creator.platform === 'tiktok' ? 'TikTok' : 'Instagram'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="text-white font-bold">
                          {formatNumber(creator.current_followers)}
                        </div>
                        {filterPeriod !== 'all_time' && (
                          <div className="text-[#10b981] text-xs font-medium flex items-center justify-end gap-1 mt-1">
                            <i className="fas fa-arrow-trend-up"></i>
                            +{formatNumber(creator.followers_gained)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar: Add Form */}
      <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-6">
        <div className="bg-[#100d23] border border-[#2d295a] rounded-3xl p-6 sticky top-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <i className="fas fa-plus-circle text-blue-500"></i> Ajouter au Radar
          </h2>
          
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Plateforme</label>
              <select 
                value={addPlatform} onChange={(e) => setAddPlatform(e.target.value)}
                className="w-full px-4 py-3 bg-[#18153a] border border-[#2d295a] rounded-xl text-sm outline-none text-white appearance-none"
              >
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Username ou Lien</label>
              <input 
                type="text" 
                value={addUsername} onChange={(e) => setAddUsername(e.target.value)}
                placeholder="@pseudo ou URL" 
                className="w-full pl-4 pr-4 py-3 bg-[#18153a] border border-[#2d295a] rounded-xl text-sm outline-none focus:border-blue-500 transition-colors text-white"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Pays</label>
              <select 
                value={addCountry} onChange={(e) => setAddCountry(e.target.value)}
                className="w-full px-4 py-3 bg-[#18153a] border border-[#2d295a] rounded-xl text-sm outline-none text-white appearance-none"
              >
                <option value="Guyane">Guyane</option>
                <option value="Suriname">Suriname</option>
                <option value="Martinique">Martinique</option>
                <option value="Guadeloupe">Guadeloupe</option>
                <option value="International">International</option>
              </select>
            </div>

            {addMessage && (
              <div className={`p-3 rounded-lg text-sm ${addMessage.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                {addMessage.text}
              </div>
            )}

            <button 
              type="submit" disabled={isAdding || !addUsername.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-satellite-dish"></i>}
              {isAdding ? 'Ajout en cours...' : 'Ajouter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
