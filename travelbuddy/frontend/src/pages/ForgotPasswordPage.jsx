import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^\+\d{1,4}\d{6,14}$/.test(identifier);

    if (!isEmail && !isPhone) {
      setError('Please enter a valid email or phone number with country code (e.g., +1234567890)');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isEmail ? '/api/otp/send-email' : '/api/otp/send-phone';
      const payload = isEmail ? { email: identifier } : { phone: identifier };

      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to send OTP');

      // Navigate to OTP verification passing the identifier and type
      navigate('/verify-reset-otp', { state: { identifier, type: isEmail ? 'email' : 'phone' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold mb-8 group">
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Back to Login
        </button>

        <div className="mb-12 text-center">
          <h1 className="text-display-lg font-headline text-3xl font-extrabold tracking-tight mb-2">Reset Password</h1>
          <p className="text-on-surface-variant font-body">Enter your email or phone number to receive a verification code.</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_50px_rgba(64,89,170,0.06)] relative border border-outline-variant/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-label font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="identifier">Email or Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">contact_mail</span>
                </div>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="alex@travelbuddy.com or +1234567890"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container transition-all outline-none"
                />
              </div>
            </div>

            {error && <p className="text-error text-xs font-bold text-center bg-error-container/20 p-2 rounded">{error}</p>}

            <button
              type="submit"
              disabled={loading || !identifier}
              className="w-full bg-gradient-to-br from-[#1B3A8A] to-[#00236F] text-white font-headline font-bold py-4 rounded-full shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
              {!loading && <span className="material-symbols-outlined text-[20px]">send</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
