'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid 
} from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import ShortGeneratorModal from './ShortGeneratorModal';

const CustomTooltip = ({ active, payload, sortBy }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18153a] border border-[#2d295a] shadow-2xl rounded-xl p-3 text-sm text-white">
        <p className="font-bold mb-1">{payload[0].payload.fullTitle}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <p className="text-emerald-400 font-bold">
            {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(payload[0].value)} {sortBy === 'likes' ? 'likes' : (sortBy === 'subscribers' ? 'abonnés' : 'vues')}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function YouTubeChartsClient() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [artistName, setArtistName] = useState('');
  const [sector, setSector] = useState('Guyane');
  const [isAdding, setIsAdding] = useState(false);
  const [addProgress, setAddProgress] = useState(null); // { current: 1, total: 5, success: 4, errors: [] }
  const [managingId, setManagingId] = useState(null); // ID of the item being updated or deleted
  
  const [searchQuery, setSearchQuery] = useState('');
  const [slideOver, setSlideOver] = useState({ isOpen: false, type: '', title: '', loading: false, videos: [], channel: null });
  const [activeVideo, setActiveVideo] = useState(null); // { id, title }

  const [charts, setCharts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);
  const [shortGeneratorModal, setShortGeneratorModal] = useState({ isOpen: false, video: null });
  
  const [activeTab, setActiveTab] = useState('clips'); // 'clips' ou 'channels'
  
  // Filtres d'affichage
  const [filterSector, setFilterSector] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all_time');
  const [sortBy, setSortBy] = useState('views'); // Pour clips: views/likes, Pour chaînes: views/subscribers
  const [exportModal, setExportModal] = useState({ isOpen: false, isLoading: false, sectors: [] });

  const fetchCharts = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'clips' ? '/api/youtube/charts' : '/api/youtube/channels/charts';
      const res = await fetch(`${endpoint}?period=${filterPeriod}&sector=${filterSector}&sort=${sortBy}`);
      const data = await res.json();
      // API clips returns { charts: [...] }, API channels returns { success: true, data: [...] }
      const results = data.charts || data.data || [];
      setCharts(results);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Restauration des filtres sauvegardés
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPeriod = localStorage.getItem('yt_filterPeriod');
      const savedSector = localStorage.getItem('yt_filterSector');
      const savedSort = localStorage.getItem('yt_sortBy');
      const savedTab = localStorage.getItem('yt_activeTab');
      
      if (savedPeriod) setFilterPeriod(savedPeriod);
      if (savedSector) setFilterSector(savedSector);
      if (savedSort) setSortBy(savedSort);
      if (savedTab) setActiveTab(savedTab);
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/youtube/notifications');
        const data = await res.json();
        if (data.notifications) setNotifications(data.notifications);
      } catch (e) {
        console.error('Fetch notifications error:', e);
      } finally {
        setIsLoadingNotifs(false);
      }
    };
    fetchNotifications();
  }, []);

  // Sauvegarde des filtres et fetch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yt_filterPeriod', filterPeriod);
      localStorage.setItem('yt_filterSector', filterSector);
      localStorage.setItem('yt_sortBy', sortBy);
      localStorage.setItem('yt_activeTab', activeTab);
    }
    fetchCharts();
  }, [filterPeriod, filterSector, sortBy, activeTab]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    // Extraire tous les liens (séparés par des sauts de ligne, virgules ou espaces)
    const links = url.split(/[\n, ]+/).map(l => l.trim()).filter(l => l.length > 0);
    
    if (links.length === 0) return;

    setIsAdding(true);
    setAddProgress({ current: 0, total: links.length, success: 0, errors: [] });
    
    let successCount = 0;
    const errorsList = [];

    const endpoint = activeTab === 'clips' ? '/api/youtube/add' : '/api/youtube/channels/add';

    for (let i = 0; i < links.length; i++) {
      setAddProgress(prev => ({ ...prev, current: i + 1 }));
      const currentLink = links[i];
      
      try {
        const bodyPayload = activeTab === 'clips' 
          ? { url: currentLink, sector, artistName: links.length === 1 ? artistName : '' } 
          : { input: currentLink, sector };
          
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });
        const data = await res.json();
        
        if (data.success) {
          successCount++;
        } else {
          errorsList.push(`${currentLink}: ${data.error}`);
        }
      } catch (error) {
        errorsList.push(`${currentLink}: Erreur réseau`);
      }
    }

    setAddProgress(prev => ({ ...prev, success: successCount, errors: errorsList }));
    
    if (successCount > 0) {
      setUrl('');
      setArtistName('');
      fetchCharts();
    }
    
    setIsAdding(false);
    
    if (errorsList.length > 0) {
      alert(`Terminé. ${successCount} ajouts réussis.\nErreurs (${errorsList.length}) :\n` + errorsList.slice(0, 3).join('\n') + (errorsList.length > 3 ? '\n...' : ''));
    }
    
    setTimeout(() => setAddProgress(null), 3000);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSlideOver({ isOpen: true, type: 'search', title: `Recherche : "${searchQuery}"`, loading: true, videos: [] });
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSlideOver(prev => ({ ...prev, loading: false, videos: data.videos || [] }));
    } catch (error) {
      setSlideOver(prev => ({ ...prev, loading: false, videos: [], error: "Erreur réseau" }));
    }
  };

  const handleOpenChannel = async (channelId, title) => {
    // Si on est sur l'onglet clips, on ouvre pas le panneau chaîne
    if (activeTab !== 'channels') return; 

    setSlideOver({ isOpen: true, type: 'channel', title: `Vidéos de ${title}`, loading: true, videos: [], channel: null });
    try {
      const res = await fetch(`/api/youtube/channels/videos?channelId=${channelId}`);
      const data = await res.json();
      setSlideOver(prev => ({ ...prev, loading: false, videos: data.videos || [], channel: data.channel || null }));
    } catch (error) {
      setSlideOver(prev => ({ ...prev, loading: false, videos: [], error: "Erreur réseau", channel: null }));
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Voulez-vous vraiment supprimer "${title}" et tout son historique ?\nCette action est irréversible.`)) return;
    
    setManagingId(id);
    try {
      const res = await fetch('/api/youtube/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', type: activeTab, id })
      });
      const data = await res.json();
      if (data.success) {
        setCharts(prev => prev.filter(item => item.id !== id));
      } else {
        alert("Erreur lors de la suppression: " + data.error);
      }
    } catch (error) {
      alert("Erreur réseau");
    } finally {
      setManagingId(null);
    }
  };

  const handleUpdateSector = async (id, newSector) => {
    setManagingId(id);
    try {
      const res = await fetch('/api/youtube/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_sector', type: activeTab, id, sector: newSector })
      });
      const data = await res.json();
      if (data.success) {
        setCharts(prev => prev.map(item => item.id === id ? { ...item, sector: newSector } : item));
      } else {
        alert("Erreur lors de la mise à jour: " + data.error);
      }
    } catch (error) {
      alert("Erreur réseau");
    } finally {
      setManagingId(null);
    }
  };

  const handleRunCron = async () => {
    if (!confirm('Forcer la synchronisation avec l\'API YouTube ?')) return;
    try {
      const res = await fetch('/api/youtube/cron');
      const data = await res.json();
      if (res.ok) {
        alert(`Synchro terminée. ${data.updated} clips mis à jour.`);
        fetchCharts();
      }
    } catch(e) {
      alert('Erreur réseau');
    }
  };

  const handleRefreshThumbnails = async () => {
    if (!confirm('Rafraîchir les photos de profil depuis YouTube ?\nCela peut prendre quelques secondes.')) return;
    try {
      const res = await fetch('/api/youtube/channels/refresh-thumbnails', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Photos mises à jour : ${data.updated} chaîne(s) rafraîchie(s).`);
        fetchCharts();
      } else {
        alert('Erreur : ' + (data.error || 'Inconnue'));
      }
    } catch(e) {
      alert('Erreur réseau');
    }
  };

  const [isImporting, setIsImporting] = useState(false);

  const handleAutoImport = async () => {
    setIsImporting(true);
    try {
      const res = await fetch('/api/youtube/channels/import-videos', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        if (data.added > 0) {
          alert(`${data.added} nouvelle(s) vidéo(s) importée(s) avec succès !`);
          fetchCharts();
        } else {
          alert("Importation terminée. Aucune nouvelle vidéo trouvée.");
        }
      } else {
        console.error("Erreur d'importation API:", data);
        alert("Erreur: " + data.error);
      }
    } catch (e) {
      console.error("Erreur réseau importation:", e);
      alert("Erreur réseau");
    } finally {
      setIsImporting(false);
    }
  };

  const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num);

  const handleExportToGenerator = () => {
    if (charts.length === 0) return;
    const top10 = charts.slice(0, 10);
    const pagesData = top10.map((video, index) => {
      let metricText = '';
      if (activeTab === 'clips') {
        metricText = filterPeriod === 'all_time' 
          ? `${formatNumber(sortBy === 'likes' ? video.current_likes : video.current_views)} ${sortBy === 'likes' ? 'Likes' : 'Vues'}`
          : `+${formatNumber(sortBy === 'likes' ? video.likes_gained : video.views_gained)} ${sortBy === 'likes' ? 'Likes' : 'Vues'} (cette période)`;
      } else {
        metricText = filterPeriod === 'all_time'
          ? `${formatNumber(sortBy === 'subscribers' ? video.current_subscribers : video.current_views)} ${sortBy === 'subscribers' ? 'Abonnés' : 'Vues'}`
          : `+${formatNumber(sortBy === 'subscribers' ? video.subs_gained : video.views_gained)} ${sortBy === 'subscribers' ? 'Abonnés' : 'Vues'} (cette période)`;
      }
        
      return {
        id: index + 1,
        title: `N°${index + 1} - ${video.channel_title || video.title}`,
        content: video.title,
        template: 't1', 
        bgImage: video.thumbnail_url,
        tag: 'CLASSEMENT',
        themeColor: '#0ea5e9', 
        partnerText: metricText,
        logoType: 'white',
        logoVersion: 'new',
        logoPosition: 'top-center',
        highlightColor: '#FBBF24',
        footerText: 'CULTURE MEDIA',
        showLive: false,
        socials: { instagram: true, youtube: true, tiktok: false },
        titleSize: 90,
        contentSize: 42,
        tagSize: 28,
        caption: `Classement: N°${index + 1}\n${video.title} ${video.channel_title ? `par ${video.channel_title}` : ''}.\nStatistiques : ${metricText}.`
      };
    });
    localStorage.setItem('youtube_charts_export', JSON.stringify(pagesData));
    router.push('/admin/instagram/custom?source=charts');
  };

  const handleExportRanking = () => {
    if (charts.length === 0) return;
    // Open sector selection modal
    setExportModal({ isOpen: true, isLoading: false, sectors: filterSector === 'all' ? [] : [filterSector] });
  };

  const confirmExportRanking = async () => {
    setExportModal(prev => ({ ...prev, isLoading: true }));
    try {
      const { sectors } = exportModal;
      const sectorParam = sectors.length === 0 ? 'all' : sectors.length === 1 ? sectors[0] : 'all';
      const endpoint = activeTab === 'clips' ? '/api/youtube/charts' : '/api/youtube/channels/charts';
      const res = await fetch(`${endpoint}?period=${filterPeriod}&sector=${sectorParam}&sort=${sortBy}`);
      const data = await res.json();
      let allItems = data.charts || data.data || [];

      // If multiple sectors selected, merge them
      if (sectors.length > 1) {
        const otherSector = sectors.find(s => s !== sectorParam);
        const res2 = await fetch(`${endpoint}?period=${filterPeriod}&sector=${otherSector}&sort=${sortBy}`);
        const data2 = await res2.json();
        const items2 = data2.charts || data2.data || [];
        // Merge and re-sort
        allItems = [...allItems, ...items2].sort((a, b) => {
          if (period === 'all_time' || filterPeriod === 'all_time') {
            return sortBy === 'likes' || sortBy === 'subscribers'
              ? (b.current_likes || b.current_subscribers || 0) - (a.current_likes || a.current_subscribers || 0)
              : b.current_views - a.current_views;
          } else {
            return sortBy === 'likes' || sortBy === 'subscribers'
              ? (b.likes_gained || b.subs_gained || 0) - (a.likes_gained || a.subs_gained || 0)
              : b.views_gained - a.views_gained;
          }
        });
      }

      const top10 = allItems.slice(0, 10);
      if (top10.length === 0) {
        alert('Aucune donnée trouvée pour ces filtres.');
        setExportModal(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const mappedItems = top10.map((item) => {
        let val = '';
        if (activeTab === 'clips') {
          val = filterPeriod === 'all_time'
            ? `${formatNumber(sortBy === 'likes' ? item.current_likes : item.current_views)} ${sortBy === 'likes' ? 'likes' : 'vues'}`
            : `+${formatNumber(sortBy === 'likes' ? item.likes_gained : item.views_gained)} ${sortBy === 'likes' ? 'likes' : 'vues'}`;
        } else {
          val = filterPeriod === 'all_time'
            ? `${formatNumber(sortBy === 'subscribers' ? item.current_subscribers : item.current_views)} ${sortBy === 'subscribers' ? 'abonnés' : 'vues'}`
            : `+${formatNumber(sortBy === 'subscribers' ? item.subs_gained : item.views_gained)} ${sortBy === 'subscribers' ? 'abonnés' : 'vues'}`;
        }
        return {
          title: activeTab === 'clips' ? item.title : item.channel_title || item.title,
          subtitle: activeTab === 'clips' ? (item.channel_title || '') : (item.sector || ''),
          image: item.thumbnail_url,
          value: val
        };
      });

      let mainTitle = activeTab === 'clips' ? 'TOP 10 CLIPS' : 'TOP 10 ARTISTES';
      if (filterPeriod === '30_days') mainTitle += ' (MOIS)';
      if (filterPeriod === '7_days') mainTitle += ' (SEMAINE)';

      const sectorLabel = sectors.length === 0 ? 'TOUS SECTEURS'
        : sectors.length === 1 ? sectors[0].toUpperCase()
        : sectors.join(' + ').toUpperCase();

      const page = {
        template: 't4',
        title: mainTitle,
        tag: sectorLabel,
        items: mappedItems,
        themeColor: '#0ea5e9',
        highlightColor: '#FBBF24',
        partnerText: 'STATISTIQUES OFFICIELLES',
        bgImage: top10[0]?.thumbnail_url || '',
        logoType: 'white',
        logoVersion: 'new',
        logoPosition: 'top-center',
        footerText: 'CULTURE MEDIA'
      };

      localStorage.setItem('youtube_charts_export', JSON.stringify([page]));
      setExportModal({ isOpen: false, isLoading: false, sectors: [] });
      router.push('/admin/instagram/custom?source=charts');
    } catch (err) {
      alert('Erreur lors de la génération : ' + err.message);
      setExportModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Calcul des KPIs globaux
  const totalViews = charts.reduce((sum, v) => sum + (v.current_views || 0), 0);
  const totalGrowth = charts.reduce((sum, v) => sum + (v.views_gained || 0), 0);
  const totalSubscribers = charts.reduce((sum, v) => sum + (v.current_subscribers || 0), 0);
  const totalSubsGrowth = charts.reduce((sum, v) => sum + (v.subs_gained || 0), 0);
  
  // Data pour le graphique (Top 10)
  const chartData = charts.slice(0, 10).map(v => {
    let valeur = 0;
    if (activeTab === 'clips') {
      valeur = filterPeriod === 'all_time' 
        ? (sortBy === 'likes' ? v.current_likes : v.current_views)
        : (sortBy === 'likes' ? v.likes_gained : v.views_gained);
    } else {
      valeur = filterPeriod === 'all_time'
        ? (sortBy === 'subscribers' ? v.current_subscribers : v.current_views)
        : (sortBy === 'subscribers' ? v.subs_gained : v.views_gained);
    }

    return {
      name: v.title.length > 15 ? v.title.substring(0, 15) + '...' : v.title,
      valeur,
      fullTitle: v.title
    };
  });



  return (
    <>
      <div className="bg-[#0b0914] -m-6 p-6 md:p-8 min-h-screen text-gray-100 font-sans">
      
      {/* Header Dashboard (like "My Dashboard") */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div className="w-full md:w-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Performances YouTube</h1>
          
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Tabs */}
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('clips')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'clips' ? 'bg-blue-600 text-white' : 'bg-[#18153a] text-gray-400 hover:text-white border border-[#2d295a]'}`}
              >
                Clips & Vidéos
              </button>
              <button 
                onClick={() => setActiveTab('channels')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'channels' ? 'bg-blue-600 text-white' : 'bg-[#18153a] text-gray-400 hover:text-white border border-[#2d295a]'}`}
              >
                Chaînes & Artistes
              </button>
            </div>

            {/* Global Search Bar */}
            <form onSubmit={handleSearch} className="relative w-full md:w-80">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une musique sur YouTube..."
                className="w-full bg-[#18153a] border border-[#2d295a] rounded-xl py-2 px-4 pl-10 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            </form>
          </div>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-12 h-12 rounded-xl bg-[#18153a] border border-[#2d295a] flex items-center justify-center text-gray-400 hover:text-white hover:border-blue-500/50 transition-all relative"
          >
            <i className="fas fa-bell"></i>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0b0914]">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-14 w-80 max-h-[500px] bg-[#100d23] border border-[#2d295a] shadow-2xl rounded-xl z-50 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#2d295a] flex items-center justify-between bg-[#18153a]/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <i className="fas fa-fire text-orange-500"></i> Dernières Sorties
                </h3>
                <span className="text-xs text-gray-400">Dernières 48h</span>
              </div>
              <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                {isLoadingNotifs ? (
                  <div className="flex justify-center py-6 text-blue-500"><i className="fas fa-spinner fa-spin text-xl"></i></div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">Aucune sortie récente</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {notifications.map((notif, idx) => (
                      <div key={idx} className="bg-[#18153a] hover:bg-[#2d295a]/30 transition-colors p-3 rounded-lg border border-[#2d295a]/50 group">
                        <div className="flex gap-3">
                          <img src={notif.thumbnail} alt="" className="w-20 h-14 object-cover rounded-md" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{notif.title}</h4>
                            <p className="text-xs text-purple-400 truncate mt-0.5">{notif.channelTitle}</p>
                            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                              <i className="fas fa-clock"></i> 
                              {new Date(notif.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setShowNotifications(false);
                            router.push(`/admin/reels-studio?title=${encodeURIComponent(notif.title)}&artist=${encodeURIComponent(notif.channelTitle)}`);
                          }}
                          className="w-full mt-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-magic"></i> Créer dans Reels Studio
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
        
        {/* Dropdowns style mockup */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center bg-[#18153a] border border-[#2d295a] rounded-xl overflow-hidden">
            <select 
              value={filterSector} onChange={(e) => setFilterSector(e.target.value)}
              className="px-4 py-2.5 text-sm bg-transparent text-gray-300 outline-none hover:text-white cursor-pointer"
            >
              <option value="all">Tous secteurs</option>
              <option value="Guyane">Guyane</option>
              <option value="Suriname">Suriname</option>
              <option value="Martinique">Martinique</option>
            </select>
          </div>
          
          <div className="flex items-center bg-[#18153a] border border-[#2d295a] rounded-xl overflow-hidden">
            <select 
              value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-2.5 text-sm bg-transparent text-gray-300 outline-none hover:text-white cursor-pointer"
            >
              <option value="7_days">7 Derniers Jours</option>
              <option value="30_days">30 Derniers Jours</option>
              <option value="all_time">Global</option>
            </select>
          </div>

          <div className="flex gap-2 ml-2">
            <button onClick={handleRunCron} className="px-4 h-10 rounded-xl bg-[#18153a] border border-[#2d295a] text-gray-400 text-sm font-semibold hover:text-white hover:border-emerald-500/50 transition-colors flex items-center gap-2">
              <i className="fas fa-sync-alt"></i> Synchro
            </button>
            {activeTab === 'clips' && (
              <button 
                onClick={handleAutoImport} 
                disabled={isImporting}
                className="px-4 h-10 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400 text-sm font-semibold hover:text-white hover:border-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Importer les dernières vidéos des chaînes suivies"
              >
                {isImporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-download-alt"></i>}
                {isImporting ? 'Importation...' : 'Auto-Importer'}
              </button>
            )}
            {activeTab === 'channels' && (
              <button 
                onClick={handleRefreshThumbnails} 
                className="px-4 h-10 rounded-xl bg-[#18153a] border border-[#2d295a] text-gray-400 text-sm font-semibold hover:text-white hover:border-purple-500/50 transition-colors flex items-center gap-2"
                title="Récupérer les vraies photos de profil depuis YouTube"
              >
                <i className="fas fa-image"></i> Photos
              </button>
            )}
            <div className="flex bg-[#18153a] rounded-xl overflow-hidden border border-[#2d295a]">
              <button 
                onClick={handleExportRanking} 
                disabled={charts.length === 0} 
                className="px-4 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] disabled:opacity-50 transition-all flex items-center gap-2 border-r border-[#2d295a]"
                title="Générer un visuel Top 10 (1 image)"
              >
                <i className="fas fa-crown"></i> Visuel Top 10
              </button>
              <button 
                onClick={handleExportToGenerator} 
                disabled={charts.length === 0} 
                className="px-4 h-10 text-gray-300 hover:text-white hover:bg-[#242145] text-sm font-semibold disabled:opacity-50 transition-all flex items-center gap-2"
                title="Générer un carrousel (10 images)"
              >
                <i className="fab fa-instagram"></i> Carrousel
              </button>
            </div>
          </div>
        </div>

      {/* KPI Cards (Exactly like Balance / Expense / Income) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* KPI 1 - Balance Style (Blue) */}
        <div className="bg-[#100d23] border border-[#242145] p-6 rounded-3xl flex justify-between items-center group">
          <div>
            <p className="text-gray-400 text-base mb-1">{activeTab === 'clips' ? 'Clips Traqués' : 'Chaînes Traquées'}</p>
            <p className="text-xs text-gray-500 mb-2">{charts.length} Total</p>
            <p className="text-3xl font-medium text-white">{charts.length}</p>
          </div>
          <div className="w-16 h-12 rounded-2xl border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-lg bg-blue-500/10">
            <i className={activeTab === 'clips' ? 'fas fa-video text-base' : 'fas fa-users text-base'}></i>
          </div>
        </div>

        {/* KPI 2 - Expense Style (Red/Pink) */}
        <div className="bg-[#100d23] border border-[#242145] p-6 rounded-3xl flex justify-between items-center group">
          <div>
            <p className="text-gray-400 text-base mb-1">{activeTab === 'clips' ? 'Volume de vues' : 'Volume d\'abonnés'}</p>
            <p className="text-xs text-gray-500 mb-2">Toutes {activeTab === 'clips' ? 'vidéos' : 'chaînes'}</p>
            <p className="text-3xl font-medium text-white">{formatNumber(activeTab === 'clips' ? totalViews : totalSubscribers)}</p>
          </div>
          <div className="w-16 h-12 rounded-2xl border border-pink-500/50 flex items-center justify-center text-pink-400 font-bold text-lg bg-pink-500/10">
            <i className={activeTab === 'clips' ? 'fas fa-eye text-base' : 'fas fa-users text-base'}></i>
          </div>
        </div>

        {/* KPI 3 - Income Style (Green) */}
        <div className="bg-[#100d23] border border-[#242145] p-6 rounded-3xl flex justify-between items-center group">
          <div>
            <p className="text-gray-400 text-base mb-1">Croissance</p>
            <p className="text-xs text-gray-500 mb-2">Gains de {activeTab === 'clips' ? 'vues' : 'abonnés'}</p>
            <p className="text-3xl font-medium text-white">+{formatNumber(activeTab === 'clips' ? totalGrowth : totalSubsGrowth)}</p>
          </div>
          <div className="w-16 h-12 rounded-2xl border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-lg bg-emerald-500/10">
            <i className="fas fa-arrow-trend-up text-base"></i>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        
        {/* Main Chart Area (Graphique du Classement) */}
        <div className="xl:col-span-2 bg-[#100d23] rounded-3xl border border-[#242145] p-6 flex flex-col h-[400px] relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          <div className="flex justify-between items-center mb-6 relative z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <i className="fas fa-chart-line text-emerald-400"></i>
              <h2 className="text-lg font-medium text-white">Graphique & Statistiques du Classement</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setSortBy('views')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${sortBy === 'views' ? 'bg-[#18153a] text-blue-400' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}
              >
                Vues
              </button>
              {activeTab === 'clips' ? (
                <button 
                  onClick={() => setSortBy('likes')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${sortBy === 'likes' ? 'bg-[#18153a] text-pink-400' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}
                >
                  Likes
                </button>
              ) : (
                <button 
                  onClick={() => setSortBy('subscribers')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${sortBy === 'subscribers' ? 'bg-[#18153a] text-purple-400' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}
                >
                  Abonnés
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 w-full relative z-10 min-h-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="neonBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" /> {/* Emerald top */}
                      <stop offset="100%" stopColor="#ef4444" /> {/* Red/Pink bottom */}
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1c3d" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dx={-10} tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(value)} />
                  <RechartsTooltip content={<CustomTooltip sortBy={sortBy} />} cursor={{fill: '#18153a'}} />
                  <Bar dataKey="valeur" fill="url(#neonBar)" radius={[10, 10, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-[#242145] rounded-2xl">
                <p className="text-sm">Données insuffisantes</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Panel: Add Video */}
        <div className="bg-[#100d23] rounded-3xl border border-[#242145] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <i className="far fa-plus-square text-gray-400"></i>
                <h2 className="text-lg font-medium text-white">Ajouter au Radar</h2>
              </div>
            </div>
            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">{activeTab === 'clips' ? 'Liens YouTube (un par ligne pour ajout en lot)' : 'Liens des chaînes ou Handles (un par ligne)'}</label>
                <div className="relative">
                  <textarea 
                    required value={url} onChange={(e) => setUrl(e.target.value)}
                    placeholder={activeTab === 'clips' ? "https://...\nhttps://..." : "https://www.youtube.com/channel/UC...\n@nomDeLaChaine"} 
                    className="w-full pl-4 pr-4 py-3 bg-[#18153a] border border-[#2d295a] rounded-xl text-sm outline-none focus:border-blue-500 transition-colors text-white h-24 resize-none"
                  />
                </div>
              </div>
              {activeTab === 'clips' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Nom de l'artiste (Optionnel, ignoré si ajout en lot)</label>
                  <div className="relative">
                    <input 
                      type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)}
                      placeholder="Auto-détecté si vide" 
                      className="w-full pl-4 pr-4 py-3 bg-[#18153a] border border-[#2d295a] rounded-xl text-sm outline-none focus:border-blue-500 transition-colors text-white"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Secteur</label>
                <select 
                  value={sector} onChange={(e) => setSector(e.target.value)}
                  className="w-full px-4 py-3 bg-[#18153a] border border-[#2d295a] rounded-xl text-sm outline-none focus:border-blue-500 transition-colors text-white appearance-none"
                >
                  <option value="Guyane">Guyane</option>
                  <option value="Suriname">Suriname</option>
                  <option value="Martinique">Martinique</option>
                  <option value="Guadeloupe">Guadeloupe</option>
                  <option value="International">International</option>
                </select>
              </div>
              <button 
                type="submit" disabled={isAdding || !url.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> 
                    {addProgress ? `Ajout... ${addProgress.current}/${addProgress.total}` : 'Ajout en cours...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus"></i> {activeTab === 'clips' ? 'Traquer le clip' : 'Traquer la chaîne'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Table du Classement (Full Width juste en dessous) */}
      <div className="bg-[#100d23] rounded-3xl border border-[#242145] p-6 mb-8 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <i className="fas fa-trophy text-amber-400"></i>
            <h2 className="text-lg font-medium text-white">Tableau du Classement des {activeTab === 'clips' ? 'Clips' : 'Chaînes'}</h2>
          </div>
          <select 
            value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-1.5 text-xs bg-[#18153a] text-gray-300 outline-none hover:text-white cursor-pointer border border-[#2d295a] rounded-lg"
          >
            <option value="views">Trier par Vues</option>
            {activeTab === 'clips' ? (
              <option value="likes">Trier par Likes</option>
            ) : (
              <option value="subscribers">Trier par Abonnés</option>
            )}
          </select>
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <div className="py-12 text-center text-gray-500 text-sm">Chargement...</div>
          ) : charts.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">Aucun résultat.</div>
          ) : (
            charts.map((item, index) => (
              <div 
                key={item.id} 
                onClick={() => activeTab === 'channels' ? handleOpenChannel(item.channel_id, item.title) : null}
                className={`flex items-center justify-between p-3.5 rounded-2xl transition-colors border border-transparent ${activeTab === 'channels' ? 'cursor-pointer hover:bg-[#18153a]/80 hover:border-blue-500/50' : 'hover:bg-[#18153a]/50 hover:border-[#2d295a]'}`}
              >
                <div className="flex items-center gap-4 w-1/2">
                  <div className="font-bold text-lg text-gray-400 w-8 text-center flex-shrink-0">
                    #{index + 1}
                  </div>
                  <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center overflow-hidden border ${activeTab === 'clips' ? 'rounded-xl bg-orange-500/20 border-orange-500/30' : 'rounded-full bg-blue-500/20 border-blue-500/30'}`}>
                    <img 
                      src={item.thumbnail_url} 
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-90"
                      onError={(e) => {
                        if (e.target.src && e.target.src.includes('maxresdefault.jpg')) {
                          e.target.src = e.target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                        } else if (e.target.src && e.target.src.includes('hqdefault.jpg')) {
                          e.target.src = e.target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                        } else {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = '<i class="fab fa-youtube text-red-500 text-xl"></i>';
                        }
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{item.title}</p>
                    {activeTab === 'clips' ? (
                      <p className="text-xs text-purple-400 mt-0.5 truncate">{item.artist_name || item.channel_title}</p>
                    ) : (
                      <p className="text-xs text-purple-400 mt-0.5 truncate">
                        {formatNumber(item.current_video_count)} vidéos
                        {filterPeriod !== 'all_time' && ` (+${formatNumber(item.videos_gained)})`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-1/4 text-center" onClick={e => e.stopPropagation()}>
                  <select 
                    value={item.sector}
                    onChange={(e) => handleUpdateSector(item.id, e.target.value)}
                    disabled={managingId === item.id}
                    className="bg-transparent border border-[#2d295a] rounded-lg px-2 py-1 text-xs text-gray-400 outline-none hover:text-white cursor-pointer disabled:opacity-50"
                  >
                    <option value="Guyane" className="bg-[#18153a]">Guyane</option>
                    <option value="Suriname" className="bg-[#18153a]">Suriname</option>
                    <option value="Martinique" className="bg-[#18153a]">Martinique</option>
                    <option value="Guadeloupe" className="bg-[#18153a]">Guadeloupe</option>
                    <option value="International" className="bg-[#18153a]">International</option>
                  </select>
                </div>
                <div className="w-1/4 text-right pr-4">
                  {filterPeriod === 'all_time' ? (
                    <>
                      <p className="text-sm font-medium text-gray-200">
                        {formatNumber(item.current_views)} vues
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {activeTab === 'clips' 
                          ? `${formatNumber(item.current_likes)} likes` 
                          : `${formatNumber(item.current_subscribers)} abonnés`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`text-sm font-medium ${item.has_baseline !== false ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {item.has_baseline !== false 
                          ? `+${formatNumber(item.views_gained)} vues`
                          : `${formatNumber(item.current_views)} vues (1er relevé)`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {activeTab === 'clips' 
                          ? (item.has_baseline !== false ? `+${formatNumber(item.likes_gained)} likes` : `${formatNumber(item.current_likes)} likes`)
                          : (item.has_baseline !== false ? `+${formatNumber(item.subs_gained)} abonnés` : `${formatNumber(item.current_subscribers)} abonnés`)}
                      </p>
                    </>
                  )}
                </div>
                <div className="text-right flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {managingId === item.id ? (
                    <i className="fas fa-spinner fa-spin text-gray-500 text-sm"></i>
                  ) : (
                    <button 
                      onClick={() => handleDelete(item.id, item.title)}
                      className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                      title="Supprimer"
                    >
                      <i className="fas fa-trash-alt text-sm"></i>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Export Sector Selection Modal */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !exportModal.isLoading && setExportModal({ isOpen: false, isLoading: false, sectors: [] })} />
          <div className="relative w-full max-w-sm bg-[#100d23] border border-[#2d295a] rounded-3xl shadow-2xl p-8 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">🏆 Générer le Visuel Top 10
              </h2>
              <p className="text-sm text-gray-400">Choisissez le ou les territoires à inclure dans le classement.</p>
            </div>

            <div className="flex flex-col gap-3">
              {['Guyane', 'Suriname', 'Martinique', 'Guadeloupe', 'International'].map(s => (
                <label key={s} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => {
                      setExportModal(prev => ({
                        ...prev,
                        sectors: prev.sectors.includes(s)
                          ? prev.sectors.filter(x => x !== s)
                          : [...prev.sectors, s]
                      }));
                    }}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                      exportModal.sectors.includes(s)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-[#2d295a] bg-[#18153a] group-hover:border-blue-500'
                    }`}
                  >
                    {exportModal.sectors.includes(s) && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{s}</span>
                </label>
              ))}

              <label className="flex items-center gap-3 cursor-pointer group mt-1 border-t border-[#2d295a] pt-3">
                <div
                  onClick={() => setExportModal(prev => ({ ...prev, sectors: [] }))}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                    exportModal.sectors.length === 0
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-[#2d295a] bg-[#18153a] group-hover:border-blue-500'
                  }`}
                >
                  {exportModal.sectors.length === 0 && <i className="fas fa-check text-white text-xs"></i>}
                </div>
                <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">Tous les territoires</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setExportModal({ isOpen: false, isLoading: false, sectors: [] })}
                disabled={exportModal.isLoading}
                className="flex-1 py-3 rounded-xl border border-[#2d295a] text-gray-400 text-sm font-semibold hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmExportRanking}
                disabled={exportModal.isLoading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {exportModal.isLoading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Génération...</>
                ) : (
                  <><i className="fas fa-crown"></i> Générer</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Générateur de Short Modal */}
      <ShortGeneratorModal 
        key={shortGeneratorModal.isOpen ? shortGeneratorModal.video?.id : 'closed'}
        isOpen={shortGeneratorModal.isOpen}
        video={shortGeneratorModal.video}
        onClose={() => setShortGeneratorModal({ isOpen: false, video: null })}
      />

    </div>
    </>
  );
}
