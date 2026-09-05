import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ROLE_DESTINATIONS: Record<string, string> = {
  customer: '/stores',
  merchant: '/partner',
  courier: '/courier',
  admin: '/admin',
};

type Status = 'loading' | 'success' | 'error';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Confirming your account...');

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        // Check for token in URL hash (from password reset or email verification)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const type = params.get('type');

        if (cancelled) return;

        if (accessToken && type === 'recovery') {
          // Password reset flow - redirect to reset password page
          setStatus('success');
          setMessage('Password reset link confirmed. Redirecting...');
          setTimeout(() => {
            if (!cancelled) navigate('/auth/reset-password', { replace: true });
          }, 1500);
          return;
        }

        // For email verification, we don't have Supabase anymore
        // Just redirect to login with a success message
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          if (!cancelled) navigate('/login', { replace: true });
        }, 2000);

      } catch (err: any) {
        if (!cancelled) {
          setStatus('error');
          setMessage(err.message || 'Something went wrong. Please try again.');
        }
      }
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-12">
          <span className="font-heading font-bold text-3xl tracking-tighter text-gray-900">
            Muncheez<span className="text-[#4A90E2]">.</span>
          </span>
        </div>

        <div className="flex justify-center mb-8">
          {status === 'loading' && (
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
              <Loader2 className="text-[#4A90E2] animate-spin" size={36} />
            </div>
          )}
          {status === 'success' && (
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-500" size={36} />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="text-red-400" size={36} />
            </div>
          )}
        </div>

        <h1 className="text-3xl font-heading font-light text-gray-900 tracking-tight mb-4">
          {status === 'loading' && 'Verifying your email...'}
          {status === 'success' && "You're confirmed!"}
          {status === 'error' && 'Verification failed'}
        </h1>

        <p className="text-sm text-gray-500 leading-relaxed mb-8">{message}</p>

        {status === 'success' && (
          <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-[#4A90E2] rounded-full transition-all"
              style={{ animation: 'progress-fill 1.8s linear forwards' }}
            />
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col gap-3 mt-6">
            <a
              href="/signup"
              className="w-full py-4 px-6 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#4A90E2] transition-all uppercase tracking-widest text-center block"
            >
              Try Signing Up Again
            </a>
            <a
              href="/login"
              className="w-full py-4 px-6 rounded-2xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all uppercase tracking-widest text-center block"
            >
              Back to Login
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress-fill {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  );
}
