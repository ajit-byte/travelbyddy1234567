import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'user';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const fetchResults = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
      const endpoint = type === 'itinerary' 
        ? `${import.meta.env.VITE_API_URL}/api/itineraries/search?q=${encodeURIComponent(query)}`
        : `${import.meta.env.VITE_API_URL}/api/posts/users/search?q=${encodeURIComponent(query)}`;
        
      const res = await fetch(endpoint, { headers: { 'x-auth-token': token || '' } });
      if (res.ok) setResults(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const handleFollow = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/social/follow/${userId}`, {
        method: 'POST',
        headers: { 'x-auth-token': token || '' },
      });
      if (res.ok) {
        setResults(prev => prev.map(u =>
          u._id === userId ? { ...u, requested: true } : u
        ));
      }
    } catch (err) { console.error(err); }
    finally { setActionLoading(prev => ({ ...prev, [userId]: false })); }
  };

  const handleUnfollow = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/social/unfollow/${userId}`, {
        method: 'POST',
        headers: { 'x-auth-token': token || '' },
      });
      if (res.ok) {
        setResults(prev => prev.map(u =>
          u._id === userId ? { ...u, following: false, requested: false, friends: false } : u
        ));
      }
    } catch (err) { console.error(err); }
    finally { setActionLoading(prev => ({ ...prev, [userId]: false })); }
  };

  const getButtonState = (u) => {
    if (u.friends) return { label: 'Unfollow', action: () => handleUnfollow(u._id), style: 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600' };
    if (u.following) return { label: 'Unfollow', action: () => handleUnfollow(u._id), style: 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600' };
    if (u.requested) return { label: 'Requested', action: null, style: 'bg-gray-100 text-gray-400 cursor-default' };
    return { label: 'Follow', action: () => handleFollow(u._id), style: 'bg-secondary text-secondary-text hover:bg-secondary-dark' };
  };

  return (
    <div className="min-h-screen bg-dominant text-dominant-text">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-secondary font-medium mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-3xl font-black text-primary mb-1 tracking-tight">Search Results</h1>
        <p className="text-slate-500 text-sm font-medium mb-10">
          {loading ? 'Searching...' : `${results.length} ${type === 'itinerary' ? 'trip' : 'user'}${results.length !== 1 ? 's' : ''} for "${query}"`}
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-20 block">search_off</span>
            <p className="font-bold text-lg text-slate-600">No {type === 'itinerary' ? 'itineraries' : 'users'} found</p>
            <p className="text-sm mt-1">Try adjusting your keywords or destination</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map(item => {
              if (type === 'itinerary') {
                return (
                  <div
                    key={item._id}
                    onClick={() => navigate(`/trip/${item._id}`)}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group flex gap-6"
                  >
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 shrink-0 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
                      <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-primary/30 text-3xl">map</span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors truncate">{item.title}</h3>
                        <div className="bg-primary/5 text-primary rounded-full px-3 py-1 flex items-center gap-1.5 shrink-0">
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                          <span className="text-xs font-bold">{item.saveCount || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <span className="truncate">{item.destinations?.join(', ') || 'Global Exploration'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.activities?.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              const u = item;
              const btn = getButtonState(u);
              return (
                <div
                  key={u._id}
                  className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-200 p-5 flex items-center gap-4 hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-2xl shrink-0 shadow-sm overflow-hidden">
                    {u.profileIconUrl ? (
                      <img src={u.profileIconUrl} alt={u.username} className="w-full h-full object-cover" />
                    ) : (u.username?.charAt(0)?.toUpperCase() || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-800 text-lg leading-tight">{u.nickname || u.username}</p>
                      {u.friends && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
                          Connection
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 font-medium">@{u.username}</p>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">ID: {u._id.substring(0, 8)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/profile/${u._id}`)}
                      className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={btn.action || undefined}
                      disabled={!btn.action || actionLoading[u._id]}
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${btn.style} disabled:opacity-60`}
                    >
                      {actionLoading[u._id] ? '...' : btn.label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
