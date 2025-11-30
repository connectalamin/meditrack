import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../utils/api';

const OAuthCallback = () => {
  const { setUser } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract tokens from URL hash
        const hash = window.location.hash.substring(1); // Remove the '#'
        
        if (!hash) {
          throw new Error('No authentication data found in URL');
        }
        
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const deviceToken = params.get('deviceToken');

        if (!accessToken || !refreshToken || !deviceToken) {
          throw new Error('Missing authentication tokens');
        }

        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('deviceToken', deviceToken);

        // Fetch user data
        const response = await api.authAPI.getMe();
        setUser(response.user);

        // Clean up URL
        window.history.replaceState({}, document.title, '/');
        
        setStatus('success');
        
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'Authentication failed');
        setStatus('error');
        
        // Redirect to auth page with error after delay
        setTimeout(() => {
          window.location.href = '/auth?error=' + encodeURIComponent(err.message || 'Authentication failed');
        }, 2000);
      }
    };

    handleCallback();
  }, [setUser]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#111725]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-[#94a3b8]">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#111725]">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-slate-900 dark:text-[#F8FAFC] font-medium mb-2">Sign in successful!</p>
          <p className="text-slate-600 dark:text-[#94a3b8] text-sm">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#111725]">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-slate-900 dark:text-[#F8FAFC] font-medium mb-2">Sign in failed</p>
          <p className="text-slate-600 dark:text-[#94a3b8] text-sm mb-4">{error}</p>
          <p className="text-slate-500 dark:text-[#94a3b8] text-xs">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;

