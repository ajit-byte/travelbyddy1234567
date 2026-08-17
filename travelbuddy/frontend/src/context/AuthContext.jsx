import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useToast } from './ToastContext';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // full profile with nickname, avatar, etc.
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchProfile = async (token) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/social/profile/me`, {
        headers: { 'x-auth-token': token },
      });
      if (res.ok) setProfile(await res.json());
    } catch (_) {}
  };

  useEffect(() => {
    const tokenData = localStorage.getItem('authTokens');
    if (tokenData) {
      try {
        const { token } = JSON.parse(tokenData);
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser(decoded.user);
          fetchProfile(token);
        } else {
          localStorage.removeItem('authTokens');
        }
      } catch (err) {
        localStorage.removeItem('authTokens');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Login failed');
      localStorage.setItem('authTokens', JSON.stringify(data));
      const decoded = jwtDecode(data.token).user;
      setUser(decoded);
      await fetchProfile(data.token);
      showToast('Successfully logged in', 'success');
      navigate(decoded.isAdmin ? '/admin' : '/homepage');
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    }
  };

  const signup = async (username, email, password, phoneNo) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, phoneNo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Signup failed');
      localStorage.setItem('authTokens', JSON.stringify(data));
      const decoded = jwtDecode(data.token).user;
      setUser(decoded);
      await fetchProfile(data.token);
      navigate('/homepage');
    } catch (err) {
      showToast(err.message || 'Signup failed', 'error');
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const requestLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem('authTokens');
    setUser(null);
    setProfile(null);
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const refreshProfile = async () => {
    const tokenData = localStorage.getItem('authTokens');
    if (tokenData) {
      const { token } = JSON.parse(tokenData);
      await fetchProfile(token);
    }
  };

  // Used by GoogleAuthSuccess — sets both user and profile from a token
  // that was already stored in localStorage by the OAuth callback page.
  const loginWithToken = async (token) => {
    const decoded = jwtDecode(token).user;
    setUser(decoded);
    await fetchProfile(token);
    return decoded;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, profile, login, signup, logout: requestLogout, refreshProfile, loginWithToken }}>
      {children}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-outline-variant/20 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-error-container text-error rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-3xl">logout</span>
            </div>
            <h2 className="text-2xl font-bold font-headline text-center text-primary mb-2">Ready to Leave?</h2>
            <p className="text-on-surface-variant text-center mb-8">Are you sure you want to log out of your account?</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmLogout} className="w-full bg-error text-on-error py-3.5 rounded-full font-bold hover:bg-error/90 transition-all outline-none">
                Yes, Log out
              </button>
              <button onClick={cancelLogout} className="w-full bg-surface-container-low text-primary py-3.5 rounded-full font-bold hover:bg-surface-container transition-all outline-none">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
