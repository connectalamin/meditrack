import { useState, useEffect } from 'react';
import { Chrome, Mail, Lock, User, ArrowRight, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://meditrack-server-alpha.vercel.app/api';
const ENABLE_GOOGLE_OAUTH = import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true';

const AuthForms = ({ view, setView }) => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Check for OAuth error in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGoogleLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 dark:from-[#0B101B] dark:via-[#111725] dark:to-[#0B101B] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-[#34D399] dark:to-[#2EB886] flex items-center justify-center shadow-lg shadow-emerald-500/30 dark:shadow-[#34D399]/30">
              <Activity className="h-7 w-7 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-[#F8FAFC] mb-3 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-[#F8FAFC] dark:to-[#94a3b8] bg-clip-text text-transparent">
            {view === 'login' ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-slate-600 dark:text-[#94a3b8] text-lg">
            {view === 'login' 
              ? 'Sign in to continue to your health dashboard' 
              : 'Create your account and start tracking your health'}
          </p>
        </div>

        <Card className="shadow-2xl shadow-slate-900/10 dark:shadow-black/50 border-0 bg-white/80 dark:bg-[#1B2430]/80 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {view === 'register' && (
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-[#F8FAFC] mb-2 flex items-center gap-2">
                  <User size={16} className="text-emerald-600 dark:text-[#34D399]" />
                  Full Name
                </label>
                <input 
                  type="text" 
                  placeholder="Enter your full name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  className="w-full bg-slate-50 dark:bg-[#0B101B] border-2 border-slate-200 dark:border-[#27335D] rounded-xl px-4 py-3.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-[#34D399]/50 dark:focus:border-[#34D399] transition-all placeholder-slate-400 dark:placeholder-[#64748b] hover:border-slate-300 dark:hover:border-[#344275]"
                />
              </div>
            )}
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-[#F8FAFC] mb-2 flex items-center gap-2">
                <Mail size={16} className="text-emerald-600 dark:text-[#34D399]" />
                Email Address
              </label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
                className="w-full bg-slate-50 dark:bg-[#0B101B] border-2 border-slate-200 dark:border-[#27335D] rounded-xl px-4 py-3.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-[#34D399]/50 dark:focus:border-[#34D399] transition-all placeholder-slate-400 dark:placeholder-[#64748b] hover:border-slate-300 dark:hover:border-[#344275]"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-[#F8FAFC] mb-2 flex items-center gap-2">
                <Lock size={16} className="text-emerald-600 dark:text-[#34D399]" />
                Password
              </label>
              <input 
                type="password" 
                placeholder="Enter your password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
                className="w-full bg-slate-50 dark:bg-[#0B101B] border-2 border-slate-200 dark:border-[#27335D] rounded-xl px-4 py-3.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-[#34D399]/50 dark:focus:border-[#34D399] transition-all placeholder-slate-400 dark:placeholder-[#64748b] hover:border-slate-300 dark:hover:border-[#344275]"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium animate-shake">
                {error}
              </div>
            )}

            <Button 
              className="w-full h-12 mt-6 text-base font-semibold group" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {view === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          {/* Google OAuth */}
          {ENABLE_GOOGLE_OAUTH && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-[#1B2430] text-slate-500 dark:text-[#94a3b8] font-medium">Or continue with</span>
                </div>
              </div>

              <Button 
                variant="secondary" 
                onClick={handleGoogleLogin}
                className="w-full h-12 flex items-center justify-center gap-3 text-base font-semibold hover:shadow-md transition-all"
              >
                <Chrome size={20} /> Continue with Google
              </Button>
            </>
          )}

          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-[#94a3b8] text-sm">
              {view === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setView(view === 'login' ? 'register' : 'login')}
                className="text-emerald-600 dark:text-[#34D399] hover:text-emerald-700 dark:hover:text-[#2EB886] font-semibold transition-colors underline-offset-4 hover:underline"
              >
                {view === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthForms;

