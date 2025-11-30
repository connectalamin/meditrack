import { useState, useEffect } from 'react';
import { Chrome } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://meditrack-server-alpha.vercel.app/api';

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
            <Button 
              variant="secondary" 
              onClick={handleGoogleLogin}
              className="w-full h-11 flex items-center justify-center gap-2"
            >
              <Chrome size={18} /> Continue with Google
            </Button>
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

