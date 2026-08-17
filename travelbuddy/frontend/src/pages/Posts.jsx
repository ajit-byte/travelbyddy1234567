import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePostCreation } from '../context/PostCreationContext';
import CommentsModal from '../components/CommentsModal';
import PostCard from '../components/PostCard';
import Navbar from '../components/Navbar';
import { useWebSettings } from '../context/WebSettingsContext';

export default function Posts() {
  const { user, profile, logout } = useContext(AuthContext);
  const { t } = useWebSettings();
  const { showToast } = useToast();
  const { openCreatePostModal, refreshKey } = usePostCreation();
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = profile?.nickname || user?.username || 'Traveler';
  const defaultAvatar = profile?.profileIconUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCYy8_f_OCfPXKJjz1G-_6DJjnuuMFSZdnq2Lqoh2jz8CkFIs_7Jycr9RiDE9QDVR3-dxLgCCyBiagTIzUpo9JCAXw6XBuLxZt-2ZjKkJERI-GZnfBrUrqqJOeX0wIViKL8Eye0v8--B9j-xKba5rmIbtT_4CCjuA4lKYfHNV21muVAgpuPIgwIEQAK81tHru0lNP_mvSdwNjYWtiUrqZynHR-aFWBTjv_30flrl5mK__QOsIbqVMrkKgEPKkHdF7DTVtB3w0jbe7Yr";
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'posts'); // 'posts', 'itineraries', 'liked', 'saved'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationLabel, setLocationLabel] = useState("Locating...");

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLabel("Staying private");
      return; 
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10`, { headers: { 'Accept-Language': 'en' } });
          if (!res.ok) return;
          const data = await res.json();
          const addr = data.address || {};
          const place = addr.county || addr.city_district || addr.city || addr.town || addr.state;
          if (place) setLocationLabel(`Active in ${place}`);
          else setLocationLabel("Staying private");
        } catch (_) { setLocationLabel("Staying private"); }
      },
      () => { setLocationLabel("Staying private"); },
      { timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
        if (!token) throw new Error('Not authenticated');

        let endpoint = `${import.meta.env.VITE_API_URL}/api/posts/my`;
        if (activeTab === 'itineraries') endpoint = `${import.meta.env.VITE_API_URL}/api/itineraries/my`;
        else if (activeTab === 'liked') endpoint = `${import.meta.env.VITE_API_URL}/api/social/profile/liked`;
        else if (activeTab === 'saved') endpoint = `${import.meta.env.VITE_API_URL}/api/itineraries/saved/list`;

        const res = await fetch(endpoint, {
          headers: { 'x-auth-token': token },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.msg || `Failed to load ${activeTab}`);
        }

        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, refreshKey]);

  const handleEdit = (post) => {
    openCreatePostModal(post);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });

      if (!res.ok) throw new Error('Failed to delete');
      setItems((prev) => prev.filter((p) => p._id !== postId));
      showToast('Post deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Could not delete post', 'error');
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/like`, { method: 'POST', headers: { 'x-auth-token': token || '' } });
      if (res.ok) { 
        const data = await res.json(); 
        // If we are in the 'liked' tab and we unliked the post, remove it from the list
        if (activeTab === 'liked' && !data.liked) {
          setItems(prev => prev.filter(p => p._id !== postId));
        } else {
          setItems(prev => prev.map(p => 
            p._id === postId ? { ...p, likeCount: data.count, isLiked: data.liked } : p
          ));
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleCommentAdded = (postId) => {
    setItems(prev => prev.map(p => 
      p._id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
    ));
  };

  // Menu toggling logic for post cards
  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [openPostMenu, setOpenPostMenu] = useState(null);
  const [viewingPost, setViewingPost] = useState(null); // post detail modal

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen">
      <Navbar />

      <div className="flex min-h-screen pt-20">
        {/* Sidebar (Left Column) */}
        <aside className="hidden lg:flex flex-col gap-2 p-6 pt-12 w-80 h-[calc(100vh-5rem)] sticky top-20 font-['Inter'] text-sm tracking-wide bg-white border-r border-outline-variant/30 overflow-y-auto">
          <div className="mb-8 flex items-center gap-4 px-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden shadow-sm">
              <img src={defaultAvatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-primary truncate hover:text-primary/70 cursor-pointer" onClick={() => navigate('/profile')}>{displayName}</div>
              <div className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <span className="whitespace-nowrap">{locationLabel}</span>
              </div>
            </div>
          </div>
          
          <nav className="flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('posts')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'posts' ? 'bg-primary/5 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined">grid_view</span>
              <span>{t('Posts')}</span>
            </button>
            <button 
              onClick={() => setActiveTab('itineraries')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'itineraries' ? 'bg-primary/5 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined">route</span>
              <span>{t('Itineraries')}</span>
            </button>
            <button 
              onClick={() => setActiveTab('liked')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'liked' ? 'bg-primary/5 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined">favorite</span>
              <span>{t('Liked Posts')}</span>
            </button>
            <button 
              onClick={() => setActiveTab('saved')} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all w-full text-left ${activeTab === 'saved' ? 'bg-primary/5 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined">bookmark</span>
              <span>{t('Saved Itineraries')}</span>
            </button>
          </nav>
          
          <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant/30 pt-6">
            <button className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-primary transition-all text-sm w-full text-left">
              <span className="material-symbols-outlined">help_outline</span>
              <span>{t('Help Center')}</span>
            </button>
            <button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-error transition-all text-sm w-full text-left">
              <span className="material-symbols-outlined">logout</span>
              <span>{t('Logout')}</span>
            </button>
          </div>
        </aside>

        {/* Main Content (Right Section) */}
        <main className="flex-1 px-6 md:px-12 py-10 max-w-7xl mx-auto w-full">
          {/* Profile Header Section */}
          <section className="mb-12 relative bg-surface-container-lowest p-8 md:p-12 rounded-3xl shadow-sm border border-outline-variant/20">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
              <div className="relative shrink-0">
                <div className="w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-white shadow-xl bg-surface-container">
                  <img alt={`${displayName} Profile`} className="w-full h-full object-cover" src={defaultAvatar}/>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left pt-2">
                <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                  <h1 className="text-4xl font-extrabold font-headline text-primary tracking-tight">{displayName}</h1>
                  {profile?.isVerified && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full border border-primary/20">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      <span>{t('Verified')}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4 mt-2">
                  {(profile?.travelPreferences || []).map((type, idx) => (
                    <span key={idx} className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed text-xs font-bold rounded-full">{type}</span>
                  ))}
                  {(!profile?.travelPreferences || profile.travelPreferences.length === 0) && (
                    <>
                      <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed text-xs font-bold rounded-full">Solo</span>
                      <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold rounded-full">Hiker</span>
                      <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed text-xs font-bold rounded-full">Photographer</span>
                    </>
                  )}
                </div>
                
                <p className="text-on-surface-variant max-w-xl text-md leading-relaxed mb-6">
                  {profile?.travelPhilosophy || profile?.bio || "Documenting the hidden corners of the world. Adventure seeker and solo-journey enthusiast."}
                </p>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4 border-t border-outline-variant/10">
                  <div className="flex justify-center md:justify-start gap-8 w-full md:w-auto">
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-primary font-bold text-xl">{profile?.stats?.posts ?? 0}</span>
                      <span className="text-outline uppercase text-[10px] tracking-widest font-bold">Posts</span>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-primary font-bold text-xl">{profile?.stats?.trips || 0}</span>
                      <span className="text-outline uppercase text-[10px] tracking-widest font-bold">Itineraries</span>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-primary font-bold text-xl">{profile?.stats?.followers || 0}</span>
                      <span className="text-outline uppercase text-[10px] tracking-widest font-bold">Followers</span>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-primary font-bold text-xl">{profile?.stats?.following || 0}</span>
                      <span className="text-outline uppercase text-[10px] tracking-widest font-bold">Following</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => navigate('/profile', { state: { openEdit: true } })} className="absolute bottom-6 right-8 px-6 py-2.5 bg-white text-primary border border-outline-variant/30 rounded-full font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm outline-none">
                  <span className="material-symbols-outlined text-lg">edit</span>
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </section>

          {/* Two-Column Post Grid */}
          <section>
            <div className="flex justify-between items-center mb-8 border-b border-outline-variant/20 pb-4">
                <h2 className="text-2xl font-bold font-headline text-primary tracking-tight">
                  {activeTab === 'posts' ? 'Recent Journeys' : 
                   activeTab === 'itineraries' ? 'My Planned Trips' : 
                   activeTab === 'liked' ? 'Liked Experiences' : 
                   'Saved Itineraries'}
                </h2>
                {(activeTab === 'posts' || activeTab === 'itineraries') && (
                  <button onClick={() => activeTab === 'posts' ? openCreatePostModal() : navigate('/create-itinerary')} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold shadow-sm hover:shadow-md transition-all text-sm outline-none">
                      <span className="material-symbols-outlined text-lg">add</span>
                      <span>{activeTab === 'posts' ? 'Create Post' : 'New Plan'}</span>
                  </button>
                )}
            </div>
            
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-surface-container-lowest rounded-2xl h-80 animate-pulse" />
                  ))}
                </div>
            ) : error ? (
                <div className="text-center py-12 text-error">
                  <p className="text-xl font-medium">{error}</p>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 text-on-surface-variant bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant/30">
                  <span className="material-symbols-outlined text-6xl text-outline mb-4">
                    {activeTab === 'posts' ? 'photo_camera' : activeTab === 'itineraries' ? 'route' : activeTab === 'liked' ? 'favorite' : 'bookmark'}
                  </span>
                  <h3 className="text-2xl font-bold font-headline mb-2 text-primary">
                    No {activeTab.replace('_', ' ')} yet
                  </h3>
                  <p className="max-w-sm mx-auto mb-6 text-on-surface/60">
                    {activeTab === 'posts' ? 'Share your travel stories!' : activeTab === 'itineraries' ? 'Plan your first adventure!' : 'Nothing here yet.'}
                  </p>
                  {(activeTab === 'posts' || activeTab === 'itineraries') && (
                    <button onClick={() => activeTab === 'posts' ? openCreatePostModal() : navigate('/create-itinerary')} className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:shadow-md transition-all outline-none">
                      {activeTab === 'posts' ? 'Create Your First Post' : 'Plan New Adventure'}
                    </button>
                  )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {items.map((item) => {
                      const isItinerary = activeTab === 'itineraries' || activeTab === 'saved';
                      
                      if (isItinerary) {
                        const startDate = item.startDate ? new Date(item.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
                        const endDate = item.endDate ? new Date(item.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                        const imgUrl = item.image 
                          ? (item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL}${item.image}`) 
                          : "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800";

                        return (
                          <div key={item._id} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-outline-variant/30 hover:shadow-xl transition-all duration-300 flex flex-col">
                            <div className="relative h-64 overflow-hidden bg-surface-container">
                                <img alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={imgUrl} />
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[11px] font-bold rounded-full uppercase">
                                       {activeTab === 'saved' ? 'Saved' : 'Itinerary'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-xl font-bold text-primary font-headline line-clamp-1">{item.title}</h3>
                                    <div className="relative">
                                        <button onClick={(e) => { e.stopPropagation(); setOpenPostMenu(openPostMenu === item._id ? null : item._id); }} className="p-1 -mr-2 text-outline hover:text-primary transition-colors outline-none shrink-0">
                                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                        </button>
                                        {openPostMenu === item._id && (
                                          <div className="absolute right-0 top-8 bg-white border border-outline-variant/20 rounded-xl shadow-xl z-10 w-32 py-1 overflow-hidden">
                                              <button onClick={(e) => { e.stopPropagation(); navigate('/trip/' + item._id, { state: { itinerary: item } }); }} className="w-full text-left px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2">
                                                <span className="material-symbols-outlined text-base">near_me</span> Open
                                              </button>
                                              {activeTab === 'itineraries' && (
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); setOpenPostMenu(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-error hover:bg-error-container/30 transition-colors flex items-center gap-2">
                                                  <span className="material-symbols-outlined text-base">delete</span> Delete
                                                </button>
                                              )}
                                          </div>
                                        )}
                                    </div>
                                </div>

                                <p className="text-secondary text-sm font-bold flex items-center gap-1.5 mb-2">
                                  <span className="material-symbols-outlined text-base">location_on</span>
                                  <span>{Array.isArray(item.destinations) ? item.destinations.join(', ') : item.destination || 'Global'}</span>
                                </p>

                                <p className="text-on-surface-variant text-sm flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-base">calendar_today</span>
                                    {startDate} {endDate ? `- ${endDate}` : ''}
                                </p>
                                
                                <p className="text-on-surface-variant text-sm line-clamp-2 mb-4 flex-1">{item.notes || 'No description available.'}</p>
                                
                                <div className="flex gap-2">
                                    <button onClick={() => navigate('/trip/' + item._id, { state: { itinerary: item } })} className="flex-1 bg-surface-container-low hover:bg-surface-container-high text-primary font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 outline-none">
                                        <span className="material-symbols-outlined text-base">visibility</span>
                                        View Plan
                                    </button>
                                </div>
                            </div>
                          </div>
                        );
                      }

                      // Default Post rendering (posts and liked)
                      return (
                        <div key={item._id} onClick={() => setViewingPost(item)} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-outline-variant/30 hover:shadow-xl transition-all duration-300 flex flex-col">
                            <div className="relative h-64 overflow-hidden bg-surface-container">
                                {item.image ? (
                                  item.mediaType === 'video' ? (
                                    // Video post — show first frame as thumbnail
                                    <video
                                      src={(item.image || '').startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL}${item.image}`}
                                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                      preload="metadata"
                                      muted
                                      playsInline
                                    />
                                  ) : (
                                    <img alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={(item.image || '').startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL}${item.image}`}/>
                                  )
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-outline">
                                       <span className="material-symbols-outlined text-5xl mb-2 opacity-50">landscape</span>
                                       <span className="text-sm font-medium opacity-50">No Image</span>
                                    </div>
                                )}
                                {/* Video play overlay */}
                                {item.mediaType === 'video' && item.image && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <span className="material-symbols-outlined text-white text-5xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                                  </div>
                                )}
                                 <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[11px] font-bold rounded-full uppercase">
                                       {(() => {
                                          const days = Math.floor((new Date() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24));
                                          return days === 0 ? 'Today' : `${days} days ago`;
                                       })()}
                                    </span>
                                    {item.type && (
                                      <span className="px-3 py-1 bg-primary/80 backdrop-blur-md text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
                                        {item.mediaType === 'video' ? '🎥 Video' : item.type}
                                      </span>
                                    )}
                                 </div>
                            </div>
                            
                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-xl font-bold text-primary font-headline line-clamp-1">{item.title}</h3>
                                    
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleToggleLike(item._id); }}
                                            className={`flex items-center gap-1 text-sm font-bold transition-colors ${item.isLiked ? 'text-primary' : 'text-error hover:text-error/70'}`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: item.isLiked ? "'FILL' 1" : "" }}>favorite</span>
                                            <span>{item.likeCount || item.likesCount || 0}</span>
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setSelectedPostForComments(item._id); }}
                                          className="flex items-center gap-1 text-outline text-sm hover:text-primary transition-colors cursor-pointer outline-none"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                                            <span>{item.commentCount || item.comments?.length || 0}</span>
                                        </button>
                                        <div className="relative">
                                            <button onClick={(e) => { e.stopPropagation(); setOpenPostMenu(openPostMenu === item._id ? null : item._id); }} className="p-1 -mr-2 text-outline hover:text-primary transition-colors outline-none shrink-0">
                                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                            </button>
                                            
                                            {/* Dropdown Menu */}
                                            {openPostMenu === item._id && (
                                              <div className="absolute right-0 top-8 bg-white border border-outline-variant/20 rounded-xl shadow-xl z-10 w-56 py-1 overflow-hidden">
                                                  {activeTab === 'liked' ? (
                                                    <>
                                                      <button 
                                                        onClick={(e) => { e.stopPropagation(); handleToggleLike(item._id); setOpenPostMenu(null); }} 
                                                        className="w-full text-left px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                                                      >
                                                        <span className="material-symbols-outlined text-base">heart_broken</span> Remove from Likes
                                                      </button>
                                                      <button 
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/profile/${item.user?._id || item.user}`); setOpenPostMenu(null); }} 
                                                        className="w-full text-left px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                                                      >
                                                        <span className="material-symbols-outlined text-base">person</span> View Creator Profile
                                                      </button>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <button onClick={(e) => { e.stopPropagation(); handleEdit(item); setOpenPostMenu(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-base">edit</span> Edit
                                                      </button>
                                                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); setOpenPostMenu(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-error hover:bg-error-container/30 transition-colors flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-base">delete</span> Delete
                                                      </button>
                                                    </>
                                                  )}
                                              </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {item.type === 'Itinerary' && item.destination && (
                                  <div className="flex items-center gap-1.5 text-secondary text-sm font-bold mb-3">
                                    <span className="material-symbols-outlined text-base">location_on</span>
                                    <span>{item.destination}</span>
                                    {item.startDate && (
                                      <span className="ml-2 px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-md text-[10px] uppercase">
                                        {new Date(item.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(item.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                <p className="text-on-surface-variant text-sm line-clamp-3 mb-4 flex-1">{item.content}</p>
                                
                                <div className="flex gap-1.5 flex-wrap mt-auto">
                                   {(Array.isArray(item.activities) && item.activities.length > 0 ? item.activities : ['Journey']).map((tag, idx) => (
                                     <span key={idx} className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${idx % 2 === 0 ? 'bg-secondary-fixed/50 text-on-secondary-fixed' : 'bg-primary-fixed/50 text-on-primary-fixed'}`}>
                                       {tag}
                                     </span>
                                   ))}
                                </div>
                            </div>
                        </div>
                      );
                    })}
                </div>
            )}
          </section>
        </main>
      </div>

      <CommentsModal 
        postId={selectedPostForComments} 
        onClose={() => setSelectedPostForComments(null)} 
        onCommentAdded={handleCommentAdded}
      />

      {/* ── Post Detail Modal ─────────────────────────────────────────── */}
      {viewingPost && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewingPost(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setViewingPost(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <PostCard
              post={viewingPost}
              onLikeClick={(id) => handleToggleLike(id)}
              onCommentClick={(id) => { setViewingPost(null); setSelectedPostForComments(id); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}