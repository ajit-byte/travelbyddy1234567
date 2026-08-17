import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useWebSettings } from '../context/WebSettingsContext';
import Navbar from '../components/Navbar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { t } = useWebSettings();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-4 relative overflow-x-hidden selection:bg-secondary-container">
      <div className="absolute top-0 w-full z-20">
        <Navbar showAuth={false} transparent={true} />
      </div>

      <div className="fixed inset-0 -z-20 bg-surface"></div>
      <div className="fixed inset-0 -z-10 bg-doodle opacity-30"></div>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary-container/5 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-secondary-container/10 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 pt-16">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <span className="text-3xl font-extrabold tracking-tight text-primary-container">{t('TravelBuddy')}</span>
          </div>
          <h1 className="text-display-lg font-headline text-3xl font-extrabold tracking-tight mb-2">{t('Welcome Back')}</h1>
          <p className="text-on-surface-variant font-body">{t('Continue your solo journey with peace of mind.')}</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_50px_rgba(64,89,170,0.06)] relative border border-outline-variant/20">
          <div className="absolute -top-4 right-8">
            <div className="bg-[#D3E4FF] px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-outline-variant/10">
              <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
              <span className="text-[10px] font-label font-bold uppercase tracking-[0.05em] text-primary">Verified Secure</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-label font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="email">{t('Email Address')}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">alternate_email</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@travelbuddy.com"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-label font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="password">{t('Password')}</label>
                <Link to="/forgot-password" className="text-[11px] font-label font-bold uppercase tracking-widest text-primary-container hover:text-primary transition-colors">{t('Forgot Password?')}</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="block w-full pl-11 pr-12 py-3.5 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-[#1B3A8A] to-[#00236F] text-white font-headline font-bold py-4 rounded-full shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? t('Signing In...') : t('Sign In')}
              {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-container-high"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-label font-bold uppercase tracking-widest">
              <span className="bg-surface-container-lowest px-4 text-outline rounded">Or sign in with</span>
            </div>
          </div>

          <div className="w-full">
            <button
              type="button"
              onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google?mode=login`}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors border border-outline-variant/10 w-full"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="text-xs font-semibold text-on-surface">Continue with Google</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant font-body text-sm">
            {t("Don't have an account?")} 
            <Link to="/signup" className="text-primary-container font-bold ml-1 hover:underline underline-offset-4">{t('Join TravelBuddy')}</Link>
          </p>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-4 opacity-50 grayscale transition-all hover:grayscale-0 hover:opacity-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span className="text-[10px] font-label font-bold uppercase tracking-widest">End-to-End Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">privacy_tip</span>
            <span className="text-[10px] font-label font-bold uppercase tracking-widest">Privacy First Design</span>
          </div>
        </div>
      </div>
    </div>
  );
}