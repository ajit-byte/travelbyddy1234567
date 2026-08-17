import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function VerifyResetOtpPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const { identifier, type } = location.state || {};

  useEffect(() => {
    if (!identifier) {
      navigate('/forgot-password');
    }
  }, [identifier, navigate]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = type === 'email' ? '/api/otp/verify-email' : '/api/otp/verify-phone';
      const payload = type === 'email' ? { email: identifier, otp: otpString } : { phone: identifier, otp: otpString };

      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Verification failed');

      // Pass resetToken to the reset page so the backend can verify it
      navigate('/reset-password', { state: { identifier, resetToken: data.resetToken } });
    } catch (err) {
      setError(err.message);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setError('');

    try {
      const endpoint = type === 'email' ? '/api/otp/send-email' : '/api/otp/send-phone';
      const payload = type === 'email' ? { email: identifier } : { phone: identifier };

      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to resend OTP');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!identifier) return null;

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
          Back
        </button>

        <div className="mb-12 text-center">
          <h1 className="text-display-lg font-headline text-3xl font-extrabold tracking-tight mb-2">Verify Code</h1>
          <p className="text-on-surface-variant font-body">We've sent a 6-digit code to <span className="font-bold text-on-surface">{identifier}</span></p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_50px_rgba(64,89,170,0.06)] relative border border-outline-variant/20">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between gap-2 sm:gap-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container transition-all outline-none"
                />
              ))}
            </div>

            {error && <p className="text-error text-xs font-bold text-center bg-error-container/20 p-2 rounded">{error}</p>}

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-gradient-to-br from-[#1B3A8A] to-[#00236F] text-white font-headline font-bold py-4 rounded-full shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
              {!loading && <span className="material-symbols-outlined text-[20px]">check_circle</span>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant font-medium">
              Didn't receive the code?{' '}
              <button 
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-primary font-bold hover:underline underline-offset-4 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
