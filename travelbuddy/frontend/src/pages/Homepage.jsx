import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { usePostCreation } from '../context/PostCreationContext';
import Navbar from '../components/Navbar';
import CommentsModal from '../components/CommentsModal';
import PostCard from '../components/PostCard';
import OnboardingModal from '../components/OnboardingModal';
import ReviewPromptModal from '../components/ReviewPromptModal';
import { useWebSettings } from '../context/WebSettingsContext';

export default function Homepage() {
  const { user, profile, refreshProfile } = useContext(AuthContext);
  const { t } = useWebSettings();
  const { openCreatePostModal, refreshKey } = usePostCreation();
  const navigate = useNavigate();
  const displayName = profile?.nickname || user?.username || 'Sarah';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  // Preserving original avatar handling but falling back to design's default
  const defaultAvatar = profile?.profileIconUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCYy8_f_OCfPXKJjz1G-_6DJjnuuMFSZdnq2Lqoh2jz8CkFIs_7Jycr9RiDE9QDVR3-dxLgCCyBiagTIzUpo9JCAXw6XBuLxZt-2ZjKkJERI-GZnfBrUrqqJOeX0wIViKL8Eye0v8--B9j-xKba5rmIbtT_4CCjuA4lKYfHNV21muVAgpuPIgwIEQAK81tHru0lNP_mvSdwNjYWtiUrqZynHR-aFWBTjv_30flrl5mK__QOsIbqVMrkKgEPKkHdF7DTVtB3w0jbe7Yr";

  const [posts, setPosts] = useState([]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [trendingTrips, setTrendingTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likeState, setLikeState] = useState({});
  const [saveState, setSaveState] = useState({});
  const [openComments, setOpenComments] = useState(null);
  const [openPostMenu, setOpenPostMenu] = useState(null);
  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState({});
  const [openReply, setOpenReply] = useState(null);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const travelTypes = ['Adventure', 'Cultural', 'Beach', 'City', 'Nature', 'Food', 'Road Trip', 'Backpacking', 'Budget', 'Luxury'];
  const [activeFilters, setActiveFilters] = useState([]);
  const [showFilterBox, setShowFilterBox] = useState(false);
  const [sortOrder] = useState('newest');
  const [locationLabel, setLocationLabel] = useState("Staying private");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Review prompt state
  const [reviewPrompt, setReviewPrompt] = useState(null); // { _id, title, endDate }
  const [reviewPromptChecked, setReviewPromptChecked] = useState(false);

  // Pricing modal state
  const [showPricingModal, setShowPricingModal] = useState(false);

  const handleOpenModal = (type) => {
    openCreatePostModal({ type });
  };

  useEffect(() => {
    if (!showFilterBox) return;
    const handler = (e) => { if (!e.target.closest('[data-filter-box]')) setShowFilterBox(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilterBox]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
        const headers = { 'x-auth-token': token || '' };
        const [postsRes, tripsRes, followingRes, trendingRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/posts`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/itineraries/my`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/posts/following/list`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/itineraries/public`, { headers }),
        ]);
        if (postsRes.ok) {
          const data = await postsRes.json();
          setPosts(data);
          
          if (token) {
            const lm = {}, sm = {}, cm = {};
            data.forEach(p => {
              lm[p._id] = { liked: !!p.isLiked, count: p.likeCount || 0 };
              sm[p._id] = { saved: !!p.isSaved };
              cm[p._id] = p.comments || []; // Backwards compatibility for comments array if needed
            });
            setLikeState(lm);
            setSaveState(sm);
          }
        }
        if (tripsRes.ok) {
          const tripsData = await tripsRes.json();
          const now = new Date(); now.setHours(0, 0, 0, 0);
          const upcoming = tripsData.filter(t => new Date(t.endDate || t.startDate) >= now);
          upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
          setUpcomingTrips(upcoming);
        }
        if (followingRes.ok) setFollowingUsers(await followingRes.json());
        if (trendingRes.ok) {
          const allPublic = await trendingRes.json();
          const sorted = [...allPublic]
            .filter(it => (it.saveCount || 0) > 0)
            .sort((a, b) => (b.saveCount || 0) - (a.saveCount || 0));
          setTrendingTrips(sorted.slice(0, 3));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [refreshKey]);

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
        if (!token) {
          setCheckingOnboarding(false);
          return;
        }
        
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/social/profile/me`, {
          headers: { 'x-auth-token': token },
        });
        
        if (res.ok) {
          const data = await res.json();
          // Show onboarding if not completed
          if (!data.onboardingComplete) {
            setShowOnboarding(true);
          }
        }
      } catch (err) {
        console.error('Error checking onboarding:', err);
      } finally {
        setCheckingOnboarding(false);
      }
    };
    
    checkOnboarding();
  }, []);

  // (matching feature reserved for premium)

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    await refreshProfile(); // Refresh profile data
  };

  // Check for pending trip review once per session (after onboarding resolves)
  useEffect(() => {
    if (reviewPromptChecked || checkingOnboarding) return;
    const checkReview = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/pending`, {
          headers: { 'x-auth-token': token },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.pending) setReviewPrompt(data.pending);
        }
      } catch { /* ignore */ }
      setReviewPromptChecked(true);
    };
    checkReview();
  }, [checkingOnboarding, reviewPromptChecked]);
  useEffect(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const activeTrip = upcomingTrips.find(t => {
      const s = new Date(t.startDate); s.setHours(0, 0, 0, 0);
      const e = new Date(t.endDate || t.startDate); e.setHours(23, 59, 59, 999);
      return now >= s && now <= e;
    });
    if (activeTrip) { setLocationLabel(`Currently in trip to ${activeTrip.title}`); return; }
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
  }, [upcomingTrips]);

  const handleToggleLike = async (postId) => {
    try {
      const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/like`, { method: 'POST', headers: { 'x-auth-token': token || '' } });
      if (res.ok) { 
        const data = await res.json(); 
        setLikeState(prev => ({ ...prev, [postId]: data }));
        // Update the posts array to reflect like count and status
        setPosts(prev => prev.map(p => 
          p._id === postId ? { ...p, likeCount: data.count, isLiked: data.liked } : p
        ));
      }
    } catch (err) { console.error(err); }
  };

  const handleCommentAdded = (postId) => {
    setPosts(prev => prev.map(p => 
      p._id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
    ));
  };

  const enrichedPosts = useMemo(() => posts.map(p => ({
    ...p,
    isLiked: likeState[p._id]?.liked ?? p.isLiked,
    likeCount: likeState[p._id]?.count ?? p.likeCount,
    isSaved: saveState[p._id]?.saved ?? p.isSaved
  })), [posts, likeState, saveState]);

  const visiblePosts = useMemo(() => [...enrichedPosts]
    .filter(p => {
      const acts = (p.activities || []).map(a => a.toLowerCase());
      if (filterType !== 'All' && !acts.some(a => a.includes(filterType.toLowerCase()))) return false;
      if (activeFilters.length > 0 && !activeFilters.some(f => acts.some(a => a.includes(f.toLowerCase())))) return false;
      if (sortOrder === 'most_liked' && (p.likeCount || 0) === 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOrder === 'most_liked') return (b.likeCount || 0) - (a.likeCount || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    }), [enrichedPosts, filterType, sortOrder, activeFilters]);

  return (
    <>
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      {!showOnboarding && reviewPrompt && (
        <ReviewPromptModal
          itinerary={reviewPrompt}
          onSkip={() => setReviewPrompt(null)}
          onDismiss={() => setReviewPrompt(null)}
        />
      )}
      <div className="bg-surface text-on-surface font-body min-h-screen relative">
      <Navbar />

      <div className="flex pt-20 min-h-screen">
        {/* SideNavBar (Left Column) */}
        <aside className="hidden lg:flex flex-col gap-2 p-6 pt-12 w-72 h-[calc(100vh-5rem)] sticky top-20 font-['Inter'] text-sm tracking-wide bg-surface">
          <div className="mb-8 flex items-center gap-4 px-4">
            <div className="w-12 h-12 rounded-2xl adventure-gradient flex items-center justify-center text-white overflow-hidden">
              {profile?.profileIconUrl ? (
                <img src={profile.profileIconUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-on-surface truncate cursor-pointer" onClick={() => navigate('/profile')}>{displayName}</div>
              <div className="text-xs text-secondary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <span>{locationLabel || "Active"}</span>
              </div>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            <button onClick={() => navigate('/posts', { state: { activeTab: 'liked' } })} className="flex items-center gap-3 px-4 py-3 text-on-surface/70 hover:bg-white hover:rounded-xl hover:shadow-sm hover:font-semibold hover:text-primary transition-all w-full text-left">
              <span className="material-symbols-outlined">favorite</span> {t('Liked Posts')}
            </button>
            <button onClick={() => navigate('/posts', { state: { activeTab: 'saved' } })} className="flex items-center gap-3 px-4 py-3 text-on-surface/70 hover:bg-white hover:rounded-xl hover:shadow-sm hover:font-semibold hover:text-primary transition-all w-full text-left">
              <span className="material-symbols-outlined">bookmark</span> {t('Saved Itineraries')}
            </button>
            <button onClick={() => navigate('/browsepage')} className="flex items-center gap-3 px-4 py-3 text-on-surface/70 hover:bg-white hover:rounded-xl hover:shadow-sm hover:font-semibold hover:text-primary transition-all w-full text-left">
              <span className="material-symbols-outlined">explore</span> {t('Explore Trips')}
            </button>
            <button onClick={() => navigate('/notifications')} className="flex items-center gap-3 px-4 py-3 text-on-surface/70 hover:bg-white hover:rounded-xl hover:shadow-sm hover:font-semibold hover:text-primary transition-all w-full text-left">
              <span className="material-symbols-outlined">notifications</span> {t('Notifications')}
            </button>
            {(!profile?.isVerified) && (
              <button onClick={() => navigate('/verification')} className="flex items-center gap-3 px-4 py-3 text-amber-600 hover:bg-amber-50 hover:rounded-xl hover:shadow-sm hover:font-semibold transition-all w-full text-left">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span> Get Verified
              </button>
            )}
            {profile?.isVerified && (
              <div className="flex items-center gap-3 px-4 py-3 text-blue-500 rounded-xl">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="font-bold text-sm">Verified Account</span>
              </div>
            )}
          </nav>
          <button onClick={() => navigate('/itineraryplanningpage')} className="mt-8 cta-gradient text-on-tertiary-fixed font-bold py-4 rounded-full shadow-lg active:scale-95 transition-all">
            {t('Start New Trip')}
          </button>
        </aside>

        {/* Main Content (Middle Section) */}
        <main className="flex-1 px-4 md:px-8 py-8 md:py-12 max-w-4xl mx-auto w-full">
          {/* Header Section */}
          <div className="mb-8 max-w-2xl">
            <h1 className="font-headline text-display-lg text-5xl font-extrabold tracking-tight text-primary mb-4">
              {t('Welcome to')} <span className="text-secondary">{t('Dashboard')}</span>, {displayName.split(' ')[0]}! 👋
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed font-body">
              {t('Ready for your next big adventure? Keep up with the latest curated trips.')}
            </p>
          </div>

          {/* Verified Itineraries Section */}
          <section className="mb-12">
            <div className="flex justify-between items-end mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-secondary mb-2 block font-body">{t('Curated for You')}</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight font-['Manrope']">{t("Verified User's Itineraries")}</h2>
              </div>
              {trendingTrips.length > 1 && (
                <button onClick={() => navigate('/browsepage')} className="text-primary font-semibold flex items-center gap-1 hover:underline text-sm md:text-base font-body">
                  {t('View All')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-body">
              {trendingTrips.length === 0 ? (
                <div className="text-on-surface-variant text-center col-span-1 md:col-span-2 py-8 bg-surface-container-lowest rounded-2xl">{t('No verified itineraries available right now.')}</div>
              ) : (
                trendingTrips.slice(0, 2).map((trip) => (
                  <div key={trip._id} className="group bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <div className="h-48 relative overflow-hidden">
                      <img alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src={trip.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuAPLuxzWmOm37RRsfOpGtKSDodXV-56Nt1Giqm5kkhFxT1tgL-KVafuFrcWqe8c5FQ8Pkmu66M9Bg9L-K2Wr_xFlmo18LbFwCevRblFcjhrH_j5hgFevjlexL-BVm1SrM2HPafnlXmGRtCAubIZsUpttaK8UsGD7MjNv93wqlLwMLTWfgV3-zY9pnhOnbwbAF_ByMENtAiSnDpg5rz0lUGohdqjoE5GOaRfF92TOe89MxnzV8V_HxDbR6cIgDI7m_udX89oBasZQQsz"}/>
                      <div className="absolute top-4 left-4 bg-secondary-fixed/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-on-secondary-fixed">{trip.saveCount || 0} {t('Total Saves')}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-1 font-['Manrope']">{trip.title}</h3>
                      <p className="text-sm text-on-surface/60 mb-4">{new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {trip.endDate ? new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Ongoing'} • {trip.budget ? `$${trip.budget}` : 'Flexible'} Budget</p>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-1">
                          {trip.tags?.slice(0, 4).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-primary-fixed/30 text-primary text-[9px] font-bold rounded-full">{tag}</span>
                          ))}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex -space-x-2">
                            {trip.user?.profileIconUrl ? (
                              <img src={trip.user.profileIconUrl} alt={trip.user.username} className="w-8 h-8 rounded-full border-2 border-white object-cover" loading="lazy" />
                            ) : (
                              <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[10px] font-bold">{trip.user?.username?.charAt(0).toUpperCase() || 'U'}</div>
                            )}
                            {trip.members?.slice(0, 3).map((member, i) => (
                              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface">
                                {member.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {trip.members?.length > 3 && (
                              <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface">
                                +{trip.members.length - 3}
                              </div>
                            )}
                          </div>
                          <button onClick={() => navigate('/trip/' + trip._id, { state: { itinerary: trip } })} className="text-sm font-bold text-primary px-4 py-2 bg-primary-fixed/30 rounded-full hover:bg-primary-fixed transition-colors text-center cursor-pointer">{t('Details')}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Create Post Section with Search/Filter */}
          <section className="mb-12 font-body">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/15">
              <div className="flex gap-4 items-center mb-4">
                <img alt="User" className="w-12 h-12 rounded-full object-cover shrink-0 cursor-pointer" src={defaultAvatar} onClick={() => navigate('/profile')} />
                <div onClick={() => openCreatePostModal()} className="flex-1 bg-surface-container-low rounded-full px-6 py-3 text-on-surface/50 text-sm cursor-pointer hover:bg-surface-container-high transition-colors truncate">
                  {t("What's on your mind?")}
                </div>
                <button onClick={() => openCreatePostModal({ type: 'Photo' })} className="w-10 h-10 shrink-0 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors">
                  <span className="material-symbols-outlined">image</span>
                </button>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/10 overflow-x-auto scroolbar-hide">
                <div className="relative shrink-0" data-filter-box>
                  <select
                    id="post-filter"
                    name="post-filter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="cursor-pointer appearance-none px-4 py-1.5 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant hover:bg-primary-fixed/30 transition-colors pr-8 outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="All">Filter: All</option>
                    {travelTypes.filter(type => !['Solo', 'Adventure', 'Budget'].includes(type)).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined text-sm absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                </div>
                <div className="flex gap-2">
                  {filterType !== 'All' && (
                    <span onClick={() => setFilterType('All')} className="cursor-pointer px-3 py-1 bg-primary text-white rounded-full text-[10px] font-bold uppercase transition shadow-md flex items-center gap-1">
                      {filterType} <span className="material-symbols-outlined text-[10px]">close</span>
                    </span>
                  )}
                  {['Solo', 'Adventure', 'Budget'].map(f => (
                    <span onClick={() => {
                        setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
                    }} key={f} className={`cursor-pointer px-3 py-1 rounded-full text-[10px] font-bold uppercase transition shadow-sm flex items-center gap-1 ${activeFilters.includes(f) ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'}`}>
                      {f} {activeFilters.includes(f) && <span className="material-symbols-outlined text-[10px]">close</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Social Feed Section */}
          <section className="space-y-8 font-body">
             {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="bg-surface-container-lowest rounded-2xl h-64 animate-pulse pt-2 px-4 pb-4"></div>)}
                </div>
             ) : visiblePosts.length === 0 ? (
                <div className="text-center py-20 text-on-surface/40 bg-surface-container-lowest rounded-2xl shadow-sm">
                  <p className="text-xl font-medium font-['Manrope']">No posts yet</p>
                  <p className="text-sm mt-1">Be the first to share your travel story!</p>
                </div>
             ) : (
               <div className="space-y-6">
                 {visiblePosts.map(post => (
                   <PostCard 
                     key={post._id} 
                     post={post} 
                     onLikeClick={handleToggleLike}
                     onCommentClick={setSelectedPostForComments}
                   />
                 ))}
               </div>
             )}
          </section>
        </main>

        {/* Right Section (Widgets) */}
        <aside className="hidden xl:block w-[420px] p-6 pt-12 space-y-8 sticky top-20 h-screen overflow-y-auto scrollbar-hide pb-24 font-['Inter']">

          {/* Pricing Banner */}
          <div
            className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-2xl p-5 shadow-lg text-white cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
            onClick={() => setShowPricingModal(true)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>diversity_3</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base font-['Manrope']">✈️ Smart Travel Matching</h3>
                <p className="text-xs text-white/80">Algorithm-matched travel companions</p>
              </div>
              <span className="text-[10px] font-black bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full uppercase tracking-wide">Premium</span>
            </div>
            <p className="text-xs text-white/70 mb-3">Find your perfect travel buddy based on style, budget, destinations & personality. Unlock with Premium.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/90">Starting at $4.99/mo</span>
              <span className="text-xs font-bold bg-white text-purple-600 px-3 py-1 rounded-full">View Plans →</span>
            </div>
          </div>

          {/* Trending Near You Widget */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 font-['Manrope']">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              Trending Near You
            </h3>
            <div className="space-y-6">
               {/* Display only top 4 trending trips sorted by highest saveCount (acting as likes) */}
               {trendingTrips.length === 0 ? (
                 <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/browsepage')}>
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container text-2xl flex items-center justify-center">
                       🌍
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate">No trending trips yet</h4>
                      </div>
                      <p className="text-xs text-on-surface/60">Be the first to create one!</p>
                    </div>
                  </div>
               ) : (
                 [...trendingTrips].sort((a,b) => (b.saveCount || 0) - (a.saveCount || 0)).slice(0, 4).map((trip, idx) => (
                     <div key={trip._id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/trip/' + trip._id, { state: { itinerary: trip } })}>
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container relative">
                        <img src={trip.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuAPLuxzWmOm37RRsfOpGtKSDodXV-56Nt1Giqm5kkhFxT1tgL-KVafuFrcWqe8c5FQ8Pkmu66M9Bg9L-K2Wr_xFlmo18LbFwCevRblFcjhrH_j5hgFevjlexL-BVm1SrM2HPafnlXmGRtCAubIZsUpttaK8UsGD7MjNv93wqlLwMLTWfgV3-zY9pnhOnbwbAF_ByMENtAiSnDpg5rz0lUGohdqjoE5GOaRfF92TOe89MxnzV8V_HxDbR6cIgDI7m_udX89oBasZQQsz"} alt={trip.title} className="w-full h-full object-cover" />
                        <div className="absolute bottom-1 right-1 text-base bg-white/80 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                          {idx === 0 ? '🔥' : idx === 1 ? '🌟' : idx === 2 ? '🌴' : '🏙️'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate">{trip.title}</h4>
                          <div className="flex items-center gap-1 text-primary flex-shrink-0">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                            <span className="text-[10px] font-bold">{trip.saveCount || 0}</span>
                          </div>
                        </div>
                        <p className="text-xs text-on-surface/60 truncate tracking-tight">{trip.destinations?.length > 0 ? trip.destinations[0] : 'Trending location'}</p>
                      </div>
                    </div>
                 ))
               )}
            </div>
          </div>

          {/* Upcoming Trips Section */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 font-['Manrope']">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>event_upcoming</span>
              Upcoming Trips
            </h3>
            <div className="space-y-4">
               {upcomingTrips.length === 0 ? (
                  <div className="text-center py-6 text-on-surface-variant/70 text-sm font-medium">
                    There are none
                  </div>
               ) : (
                 upcomingTrips.slice(0, 3).map((trip, idx) => {
                    const sd = new Date(trip.startDate);
                    const isEven = idx % 2 === 0;
                    return (
                        <div key={trip._id} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container transition-colors" onClick={() => navigate('/trip/' + trip._id, { state: { itinerary: trip } })}>
                          <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${isEven ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                            <span className="text-[10px] font-bold uppercase">{sd.toLocaleDateString('en-US', { month: 'short' })}</span>
                            <span className="text-sm font-bold leading-none">{sd.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-bold truncate">{trip.title}</h5>
                            <p className="text-[10px] text-on-surface/60">{(new Date(trip.endDate || trip.startDate) - sd) / (1000 * 60 * 60 * 24) + 1} Days • {trip.destinations?.length > 0 ? trip.destinations[0] : 'Booked'}</p>
                          </div>
                          <span className="material-symbols-outlined text-on-surface/30 text-sm">chevron_right</span>
                        </div>
                    );
                 })
               )}
            </div>
          </div>
        </aside>
      </div>

      <CommentsModal 
        postId={selectedPostForComments} 
        onClose={() => setSelectedPostForComments(null)} 
        onCommentAdded={handleCommentAdded}
      />

            {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowPricingModal(false)}>
          <div className="bg-surface rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-8 text-white text-center relative">
              <button onClick={() => setShowPricingModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 mb-4">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>diversity_3</span>
              </div>
              <h2 className="font-headline text-2xl font-extrabold mb-2">Unlock Smart Travel Matching</h2>
              <p className="text-white/80 text-sm">Find your perfect travel companion with our AI-powered algorithm</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-purple-200 rounded-2xl p-6 hover:border-purple-400 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-headline text-lg font-extrabold text-on-surface">Premium</h3>
                  <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Popular</span>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-purple-600">$4.99</span>
                  <span className="text-on-surface-variant text-sm">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {['Smart buddy matching algorithm','Up to 10 matches per month','Compatibility score & reasons','Direct message matched buddies','Verified traveler badge priority'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-on-surface">
                      <span className="material-symbols-outlined text-purple-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>{f}
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-purple-600 text-white font-bold py-3 rounded-full hover:bg-purple-700 transition-all active:scale-95">Get Premium</button>
              </div>
              <div className="border-2 border-indigo-500 rounded-2xl p-6 relative bg-gradient-to-b from-indigo-50 to-white hover:shadow-xl transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">Best Value</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-headline text-lg font-extrabold text-on-surface">Pro Premium</h3>
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">⭐ Pro</span>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-indigo-600">$9.99</span>
                  <span className="text-on-surface-variant text-sm">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {['Everything in Premium','Unlimited matches per month','Advanced personality matching','Priority in match queue','Group trip matching (up to 6)','Exclusive Pro traveler badge'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-on-surface">
                      <span className="material-symbols-outlined text-indigo-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>{f}
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold py-3 rounded-full hover:opacity-90 transition-all active:scale-95 shadow-lg">Get Pro Premium</button>
              </div>
            </div>
            <p className="text-center text-xs text-on-surface-variant pb-6 px-6">Cancel anytime. No hidden fees.</p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}