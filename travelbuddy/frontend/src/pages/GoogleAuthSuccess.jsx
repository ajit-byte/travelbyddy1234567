import { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Landing page for Google OAuth callback.
 * URL: /auth/google/success?token=<jwt>[&hint=existing]
 * Reads the token, stores it, then redirects to homepage.
 */
export default function GoogleAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext);
  const { showToast } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    const hint  = searchParams.get('hint');

    if (!token) {
      navigate('/login?error=no_token');
      return;
    }

    try {
      const decoded = jwtDecode(token);

      if (decoded.exp * 1000 < Date.now()) {
        navigate('/login?error=token_expired');
        return;
      }

      // Store token first
      localStorage.setItem('authTokens', JSON.stringify({ token }));

      // loginWithToken sets BOTH user and profile in context synchronously
      // before we navigate — this prevents the GuestRoute race condition
      loginWithToken(token).then((decodedUser) => {
        const msg = hint === 'existing'
          ? 'Account found — you\'ve been logged in with Google'
          : 'Successfully signed in with Google';
        showToast(msg, 'success');
        navigate(decodedUser?.isAdmin ? '/admin' : '/homepage', { replace: true });
      });
    } catch {
      navigate('/login?error=invalid_token');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-on-surface-variant font-medium">Signing you in with Google...</p>
      </div>
    </div>
  );
}
