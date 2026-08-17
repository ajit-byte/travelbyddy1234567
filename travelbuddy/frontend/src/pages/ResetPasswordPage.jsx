import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const { identifier, resetToken } = location.state || {};

  useEffect(() => {
    // If user somehow accesses this page without going through the OTP flow, redirect them
    if (!identifier || !resetToken) {
      navigate('/forgot-password');
    }
  }, [identifier, resetToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, newPassword: password, resetToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to reset password');

      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!identifier || !resetToken) return null;

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
          <h1 className="text-display-lg font-headline text-3xl font-extrabold tracking-tight mb-2">Create New Password</h1>
          <p className="text-on-surface-variant font-body">Enter a strong password to secure your account.</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_50px_rgba(64,89,170,0.06)] relative border border-outline-variant/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-label font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="password">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={6}
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

            <div className="space-y-2 text-left">
              <label className="text-[11px] font-label font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">lock_reset</span>
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="block w-full pl-11 pr-12 py-3.5 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {error && <p className="text-error text-xs font-bold text-center bg-error-container/20 p-2 rounded">{error}</p>}
            {success && <p className="text-green-600 text-xs font-bold text-center bg-green-50 p-2 rounded">{success}</p>}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword || !!success}
              className="w-full bg-gradient-to-br from-[#1B3A8A] to-[#00236F] text-white font-headline font-bold py-4 rounded-full shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
              {!loading && <span className="material-symbols-outlined text-[20px]">password</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
