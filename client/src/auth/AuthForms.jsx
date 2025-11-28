import { useState, useEffect, useRef } from 'react';
import { Chrome } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const AuthForms = ({ view, setView }) => {
  const { login, register, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (view === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load Google Identity Services script
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!googleClientId) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
        });

        // Render the button
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            type: 'standard',
          });
        }
      }
    };
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const handleGoogleCallback = async (response) => {
    try {
      setError('');
      setGoogleLoading(true);
      await googleLogin(response.credential);
    } catch (err) {
      setError(err.message || 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!googleClientId) {
      setError('Google OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
      return;
    }

    // Trigger the Google Sign-In flow
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google Sign-In is not available. Please refresh the page.');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50 dark:bg-[#111725]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC] mb-2">
            {view === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-600 dark:text-[#94a3b8]">
            {view === 'login' ? 'Enter your credentials to access your dashboard' : 'Start managing your health today'}
          </p>
        </div>

        <Card className="shadow-2xl shadow-slate-200/50 dark:shadow-[#000000]/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <Input 
                label="Full Name" 
                type="text" 
                placeholder="John Doe" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
              />
            )}
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button 
              className="w-full h-11 mt-2" 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Processing...' : (view === 'login' ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-[#1B2430] text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="w-full">
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div ref={googleButtonRef} className="w-full [&>div]:w-full [&>div>div]:w-full"></div>
            ) : (
              <Button 
                variant="secondary" 
                onClick={() => setError('Google OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.')} 
                className="w-full h-11 flex items-center justify-center gap-2"
                disabled
              >
                <Chrome size={18} /> Google (Not Configured)
              </Button>
            )}
            {googleLoading && (
              <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-2 text-center">Signing in with Google...</p>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-slate-600 dark:text-[#94a3b8]">
            {view === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setView(view === 'login' ? 'register' : 'login')}
              className="text-emerald-600 hover:underline font-medium dark:text-[#34D399]"
            >
              {view === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthForms;

